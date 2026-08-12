#!/usr/bin/env bash
set -euo pipefail

project_name="construction-project-saas-e2e"
compose=(docker compose -p "$project_name" -f compose.yaml -f compose.e2e.yaml --profile test)
test_url="postgresql+psycopg://construction_test:construction_test_demo_password@test-db:5432/construction_saas_test"

cleanup() {
  "${compose[@]}" down -v --remove-orphans
}
trap cleanup EXIT

"${compose[@]}" config --quiet
"${compose[@]}" build
"${compose[@]}" up -d --wait frontend backend test-db

"${compose[@]}" exec -T backend alembic downgrade base
"${compose[@]}" exec -T backend alembic upgrade head
"${compose[@]}" exec -T backend alembic current
"${compose[@]}" exec -T backend alembic check
"${compose[@]}" exec -T backend alembic downgrade 20260812_02
"${compose[@]}" exec -T backend alembic upgrade head

"${compose[@]}" exec -T -e TEST_DATABASE_URL="$test_url" backend pytest
"${compose[@]}" exec -T backend ruff check .
"${compose[@]}" exec -T backend ruff format --check .

"${compose[@]}" run --rm frontend-quality npm test -- --run
"${compose[@]}" run --rm frontend-quality npm run lint
"${compose[@]}" run --rm frontend-quality npm run format:check
"${compose[@]}" run --rm frontend-quality npm run typecheck
docker build --target build -t construction-project-saas-frontend-phase9-check frontend

"${compose[@]}" exec -T backend python -m app.db.seed
"${compose[@]}" exec -T backend python -m app.db.seed
"${compose[@]}" run --rm e2e

curl --fail --silent --show-error http://localhost:3010/api/v1/health
"${compose[@]}" exec -T frontend id
"${compose[@]}" exec -T backend id

docker build --target production -t construction-project-saas-backend-phase9-check backend
docker run --rm construction-project-saas-backend-phase9-check \
  python -c "import importlib.util; assert importlib.util.find_spec('pytest') is None; assert importlib.util.find_spec('ruff') is None; assert importlib.util.find_spec('httpx') is None"

git diff --check
