import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const manager = {
  email: process.env.E2E_MANAGER_EMAIL ?? "manager@example.com",
  password: process.env.E2E_MANAGER_PASSWORD ?? "DemoManager123!",
};
const admin = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@example.com",
  password: process.env.E2E_ADMIN_PASSWORD ?? "DemoAdmin123!",
};
const member = {
  email: process.env.E2E_MEMBER_EMAIL ?? "member@example.com",
  password: process.env.E2E_MEMBER_PASSWORD ?? "DemoMember123!",
};

type ProjectRecord = {
  id: number;
  name: string;
  status: string;
  version: number;
};

function suffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

async function authenticatedApi(
  baseURL: string,
  identity = manager,
): Promise<APIRequestContext> {
  const anonymous = await playwrightRequest.newContext({
    baseURL: `${baseURL}/api/v1/`,
  });
  const login = await anonymous.post("auth/login", {
    data: { email: identity.email, password: identity.password },
  });
  expect(login.ok()).toBeTruthy();
  const { token } = (await login.json()) as { token: string };
  await anonymous.dispose();
  return playwrightRequest.newContext({
    baseURL: `${baseURL}/api/v1/`,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

async function createProject(api: APIRequestContext, label = suffix()) {
  const customerResponse = await api.post("customers", {
    data: { code: `C-${label}`.slice(0, 30), name: `Customer ${label}` },
  });
  expect(customerResponse.status()).toBe(201);
  const customer = (await customerResponse.json()) as {
    id: number;
    code: string;
  };
  const propertyResponse = await api.post("properties", {
    data: {
      customer_id: customer.id,
      name: `Property ${label}`,
      prefecture: "東京都",
      city: "千代田区",
      address_line: "1-1",
    },
  });
  expect(propertyResponse.status()).toBe(201);
  const property = (await propertyResponse.json()) as { id: number };
  const projectResponse = await api.post("projects", {
    data: {
      code: `P-${label}`.slice(0, 30),
      name: `Project ${label}`,
      customer_id: customer.id,
      property_id: property.id,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    },
  });
  expect(projectResponse.status()).toBe(201);
  return {
    customer,
    property,
    project: (await projectResponse.json()) as ProjectRecord,
  };
}

async function login(page: Page, identity = manager, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("メールアドレス").fill(identity.email);
  await page.getByLabel("パスワード").fill(identity.password);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test("login, project search/detail, logout, and hydration stay consistent", async ({
  page,
  baseURL,
}) => {
  const api = await authenticatedApi(baseURL!);
  const { project } = await createProject(api);
  await api.dispose();
  const hydrationMessages: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().includes("Hydration failed")
    ) {
      hydrationMessages.push(message.text());
    }
  });

  await login(page, manager, "/projects");
  await expect(page).toHaveURL(/\/projects$/);
  await page
    .getByRole("textbox", { name: "案件名", exact: true })
    .fill(project.name);
  await page.getByRole("button", { name: "検索" }).click();
  await expect(page).toHaveURL(/name=/);
  await page.getByRole("link", { name: new RegExp(project.name) }).click();
  await expect(
    page.getByRole("heading", { name: "案件詳細・更新" }),
  ).toBeVisible();

  await page.goto("/account");
  await page.getByRole("button", { name: "ログアウト" }).click();
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/login\?next=%2Fprojects/);
  expect(hydrationMessages).toEqual([]);
});

test("MANAGER registers and updates customer, property, and project through UI", async ({
  page,
}) => {
  const id = suffix();
  const customerCode = `UI-C-${id}`.slice(0, 30);
  await login(page);
  await page.goto("/customers/new");
  await page.getByLabel("顧客コード").fill(customerCode);
  await page.getByLabel("顧客名").fill(`UI Customer ${id}`);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page).toHaveURL(/\/customers\/\d+/);
  await page.getByLabel("顧客名").fill(`Updated Customer ${id}`);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByLabel("顧客名")).toHaveValue(`Updated Customer ${id}`);

  await page.goto("/properties/new");
  await page
    .getByLabel("顧客")
    .selectOption({ label: `${customerCode} Updated Customer ${id}` });
  await page.getByLabel("物件名").fill(`UI Property ${id}`);
  await page.getByLabel("都道府県").fill("東京都");
  await page.getByLabel("市区町村").fill("中央区");
  await page.getByLabel("住所").fill("2-2");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page).toHaveURL(/\/properties\/\d+/);

  await page.goto("/projects/new");
  await page.getByLabel("案件コード").fill(`UI-P-${id}`.slice(0, 30));
  await page.getByLabel("案件名").fill(`UI Project ${id}`);
  await page
    .getByLabel("顧客")
    .selectOption({ label: `${customerCode} Updated Customer ${id}` });
  await page.getByLabel("物件").selectOption({ label: `UI Property ${id}` });
  await page.getByLabel("開始日").fill("2026-09-01");
  await page.getByLabel("終了日").fill("2026-09-30");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/\d+/);
  await page.getByLabel("案件名").fill(`Updated Project ${id}`);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByLabel("案件名")).toHaveValue(`Updated Project ${id}`);
});

test("combined filters, stable sorting, pagination, and URL restoration", async ({
  page,
  baseURL,
}) => {
  const api = await authenticatedApi(baseURL!);
  const id = suffix();
  const first = await createProject(api, `${id}00`);
  for (let index = 1; index < 11; index += 1) {
    await createProject(api, `${id}${String(index).padStart(2, "0")}`);
  }
  await api.dispose();
  await login(page);
  await page.goto("/projects");
  await page
    .getByRole("textbox", { name: "案件名", exact: true })
    .fill(`Project ${id}`);
  await page.getByLabel("顧客").selectOption(String(first.customer.id));
  await page.getByLabel("顧客").selectOption("");
  await page.getByLabel("期間開始").fill("2026-08-01");
  await page.getByLabel("期間終了").fill("2026-08-31");
  await page.getByLabel("並び替え").selectOption("code");
  await page.getByLabel("順序").selectOption("asc");
  await page.getByLabel("1ページ件数").selectOption("10");
  await page.getByRole("button", { name: "検索" }).click();
  await expect(page).toHaveURL(/name=Project/);
  await expect(page).toHaveURL(/sort=code/);
  await expect(page.getByText(/11件中 10件を表示/)).toBeVisible();
  await page.getByRole("button", { name: "次のページ" }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "案件名", exact: true }),
  ).toHaveValue(`Project ${id}`);
  await expect(page.getByText(/11件中 1件を表示/)).toBeVisible();
});

test("Gantt switches month/week, moves period, and links to detail", async ({
  page,
  baseURL,
}) => {
  const api = await authenticatedApi(baseURL!);
  const { project } = await createProject(api);
  await api.dispose();
  await login(page);
  await page.goto("/schedule?mode=month&anchor=2026-08-12");
  await expect(
    page.getByRole("link", { name: new RegExp(project.name) }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "週表示" }).click();
  await expect(page).toHaveURL(/mode=week/);
  await expect(page.getByText(/2026-08-10〜2026-08-16/)).toBeVisible();
  await page.getByRole("button", { name: "次へ" }).click();
  await expect(page).toHaveURL(/anchor=2026-08-19/);
  await page.getByRole("button", { name: "前へ" }).click();
  await page
    .getByRole("link", { name: new RegExp(project.name) })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/projects/${project.id}$`));
});

test("Kanban success is optimistic and settles to the server version", async ({
  page,
  baseURL,
}) => {
  const api = await authenticatedApi(baseURL!);
  const { project } = await createProject(api);
  await api.dispose();
  await login(page);
  await page.goto("/kanban");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    `**/api/v1/projects/${project.id}/status-transitions`,
    async (route) => {
      await gate;
      await route.continue();
    },
  );
  const card = page.getByRole("article", {
    name: `${project.name} 案件カード`,
  });
  await card.getByRole("button", { name: "PLANNEDへ移動" }).click();
  await expect(
    page.getByRole("region", { name: "PLANNED" }).getByText(project.name),
  ).toBeVisible();
  release();
  await expect(card.getByText("2", { exact: true })).toBeVisible();
});

test("Kanban rolls optimistic state back on API failure", async ({
  page,
  baseURL,
}) => {
  const api = await authenticatedApi(baseURL!);
  const { project } = await createProject(api);
  await api.dispose();
  await login(page);
  await page.goto("/kanban");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    `**/api/v1/projects/${project.id}/status-transitions`,
    async (route) => {
      await gate;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed",
            field_errors: [],
            conflict: null,
          },
        }),
      });
    },
  );
  await page
    .getByRole("article", { name: `${project.name} 案件カード` })
    .getByRole("button", { name: "PLANNEDへ移動" })
    .click();
  await expect(
    page.getByRole("region", { name: "PLANNED" }).getByText(project.name),
  ).toBeVisible();
  release();
  await expect(page.getByText(/サーバー処理に失敗/)).toBeVisible();
  await expect(
    page.getByRole("region", { name: "DRAFT" }).getByText(project.name),
  ).toBeVisible();
  await expect(
    page.getByText("version").locator("..").getByText("1").first(),
  ).toBeVisible();
});

test("stale Kanban version shows 409 and restores the server winner", async ({
  page,
  baseURL,
}) => {
  const api = await authenticatedApi(baseURL!);
  const { project } = await createProject(api);
  await api.dispose();
  await login(page);
  await page.goto("/kanban");
  const winnerApi = await authenticatedApi(baseURL!, admin);
  const winner = await winnerApi.post(
    `projects/${project.id}/status-transitions`,
    {
      data: { expected_version: 1, status: "CANCELLED" },
    },
  );
  expect(winner.ok()).toBeTruthy();
  await winnerApi.dispose();
  await page
    .getByRole("article", { name: `${project.name} 案件カード` })
    .getByRole("button", { name: "PLANNEDへ移動" })
    .click();
  await expect(page.getByText(/更新が競合/)).toBeVisible();
  const winnerCard = page
    .getByRole("region", { name: "CANCELLED" })
    .getByRole("article", {
      name: `${project.name} 案件カード`,
    });
  await expect(winnerCard).toBeVisible();
  await expect(winnerCard).toContainText("version2");
});

test("MEMBER scope, API denial, and multiple-assignee history are enforced", async ({
  page,
  baseURL,
}) => {
  const managementApi = await authenticatedApi(baseURL!);
  const assigned = await createProject(managementApi);
  const unassigned = await createProject(managementApi);
  const assigneesResponse = await managementApi.get("assignees");
  const assignees = (await assigneesResponse.json()) as {
    items: { id: number; display_name: string }[];
  };
  const managerAssignee = assignees.items.find(
    (item) => item.display_name === "Demo Manager",
  )!;
  const memberAssignee = assignees.items.find(
    (item) => item.display_name === "Demo Member",
  )!;
  const assignment = await managementApi.put(
    `projects/${assigned.project.id}/assignees`,
    {
      data: {
        expected_version: 1,
        assignee_ids: [managerAssignee.id, memberAssignee.id],
      },
    },
  );
  expect(assignment.ok()).toBeTruthy();
  const planned = await managementApi.post(
    `projects/${assigned.project.id}/status-transitions`,
    { data: { expected_version: 2, status: "PLANNED" } },
  );
  expect(planned.ok()).toBeTruthy();

  await login(page);
  await page.goto(`/projects/${assigned.project.id}`);
  await expect(page.getByText(/ASSIGNEES_CHANGED/)).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Demo Manager" }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Demo Member" }),
  ).toBeChecked();
  await page.goto("/account");
  await page.getByRole("button", { name: "ログアウト" }).click();

  await login(page, member, "/projects");
  await expect(
    page.getByRole("link", { name: new RegExp(assigned.project.name) }),
  ).toBeVisible();
  await expect(page.getByText(unassigned.project.name)).toHaveCount(0);
  await page.goto("/kanban");
  const memberCard = page.getByRole("article", {
    name: `${assigned.project.name} 案件カード`,
  });
  await expect(
    memberCard.getByRole("button", { name: "IN_PROGRESSへ移動" }),
  ).toBeVisible();
  await expect(
    memberCard.getByRole("button", { name: /CANCELLED/ }),
  ).toHaveCount(0);

  const memberApi = await authenticatedApi(baseURL!, member);
  expect(
    (await memberApi.get(`projects/${assigned.project.id}`)).status(),
  ).toBe(200);
  expect(
    (await memberApi.get(`projects/${unassigned.project.id}`)).status(),
  ).toBe(403);
  expect((await memberApi.get("customers")).status()).toBe(403);
  expect(
    (
      await memberApi.post(
        `projects/${assigned.project.id}/status-transitions`,
        {
          data: { expected_version: 3, status: "CANCELLED" },
        },
      )
    ).status(),
  ).toBe(403);
  await memberApi.dispose();
  await managementApi.dispose();
});
