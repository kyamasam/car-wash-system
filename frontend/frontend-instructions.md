# Frontend Agent Instructions

Agent-facing reference for wring frontends 

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 — App Router, RSC-ready |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York style) |
| UI Primitives | Radix UI, lucide-react icons |
| Dashboard UI | Ant Design ^5.21.0 (dashboard pages only — see §Ant Design) |
| Data Fetching | Axios + TanStack Query v5 |
| State | Zustand v5 (domain stores), React Context (app-wide UI) |
| Forms | `useState` (short forms), React Hook Form (complex forms), antd `Form` (dashboard forms) |
| Notifications | react-hot-toast (general), `App.useApp()` (inside antd surfaces) |
| Charts | Recharts |
| Auth | JWT (localStorage) + Google OAuth (`@react-oauth/google`) |

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Login, register, password reset
│   ├── (dashboard)/  # Protected routes
│   └── (marketing)/  # Public pages
├── components/
│   ├── ui/           # Shadcn primitives (button, dialog, input…)
│   ├── layout/       # Sidebar, top-bar, org/branch switchers
│   ├── auth/         # Auth forms and flows
│   ├── jobs/         # Job management feature components
│   ├── reports/      # Chart + table report components
│   └── <domain>/     # One folder per feature domain
├── hooks/
│   ├── use-api.ts    # Core API hooks (READ THIS FIRST)
│   ├── auth/         # useCurrentUser, useManualLogin…
│   ├── org/          # useOrganizations, useOrgMembers…
│   └── reports/      # useRevenueReport, useProfitReport…
├── stores/           # Zustand stores (one per domain)
├── contexts/         # OrgProvider, BranchProvider, CurrencyProvider
├── types/            # TS types organized by domain
└── lib/
    ├── utils.ts      # cn(), getUserInitials(), formatters
    └── nav-items.ts  # Sidebar navigation config
```

All imports use the `@/*` alias (maps to `src/`).

---

## Data Fetching

Everything goes through two hooks in `@/hooks/use-api.ts`. **Never call axios directly in components.**

### Reading data

```typescript
import { useApiQuery } from "@/hooks/use-api";

const { data, isLoading, isError } = useApiQuery<CustomerListResponse>(
  "/customers/",
  { params: { search: query } }   // optional TanStack Query options
);
```

- The query key is derived from the URL automatically.
- Auth header is injected by the axios interceptor — no manual token handling.

### Mutating data

```typescript
import { useApiMutation } from "@/hooks/use-api";

const { mutate, isPending } = useApiMutation<Customer, CreateCustomerPayload>({
  method: "POST",
  url: "/customers/",
  invalidateQueries: ["/customers/"],  // cache keys to bust on success
});

mutate(payload);
```

- Success and error toasts fire automatically via the response interceptor.
- Use `url: (vars) => \`/customers/${vars.id}/\`` for dynamic URLs.

### API base URL

Set via `NEXT_PUBLIC_API_URL` env var. Defaults to `http://localhost:8000/api`.

---

## State Management

Use the right layer for the right concern:

| Concern | Tool |
|---|---|
| Server data (lists, detail) | TanStack Query via `useApiQuery` |
| Domain async state (pre-fetched, shared) | Zustand store in `@/stores/` |
| App-wide UI state (active org, branch, currency) | React Context in `@/contexts/` |
| Local UI state (open/close, form fields) | `useState` inside the component |

### Adding a Zustand store

Follow the pattern in `@/stores/customers-store.ts`:

```typescript
const useCustomersStore = create<CustomersStore>((set) => ({
  customersAll: [],
  customersAllLoading: false,
  customersAllError: null,
  fetchCustomersAll: async (params) => { /* axios call */ },
}));
```

### Consuming context

```typescript
import { useActiveOrg } from "@/contexts/org-context";
const { activeOrg } = useActiveOrg();
```

---

## Styling

- Use Tailwind utility classes directly. No CSS modules.
- Combine classes with `cn()` from `@/lib/utils` — it merges Tailwind conflicts correctly.
- Use shadcn components from `@/components/ui/` as the base layer for all UI elements on public and auth pages.
- Colors use CSS variables (`--primary`, `--background`, etc.) — don't hardcode hex values.
- Dark mode is managed by `next-themes`; use `dark:` variants when needed.

```typescript
import { cn } from "@/lib/utils";

<div className={cn("flex items-center gap-2", isActive && "text-primary")} />
```

---

## Component Conventions

```typescript
"use client";  // required for any component with hooks or event handlers

import ...

interface Props {
  label: string;
  onSubmit: (value: string) => void;
}

export function MyComponent({ label, onSubmit }: Props) { ... }
```

- File names: kebab-case (`create-job-form.tsx`).
- One component per file.
- Feature components live in `src/components/<domain>/`.
- Reusable primitives live in `src/components/ui/`.

---

## Forms

**Short forms** (2–4 fields): use `useState`.

```typescript
const [form, setForm] = useState({ email: "", password: "" });
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
  setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
```

**Complex forms**: use React Hook Form via the wrappers in `@/components/ui/form.tsx`.

- No centralized Zod schemas exist yet — validate by handling API error responses.
- Field-level errors arrive via the response interceptor and can be shown with the `Alert` component.

**Dashboard forms**: use antd `Form` — see the [Ant Design — Forms](#ant-design--forms) section below.

---

## Notifications

- **Automatic**: mutations trigger success/error toasts via the axios interceptor — no extra code needed.
- **Manual (non-antd surfaces)**: `import toast from "react-hot-toast"; toast("Message");`
- **Manual (inside antd surfaces)**: use `App.useApp()` — see [Ant Design — Feedback](#ant-design--feedback).
- Do not add redundant toast calls on top of `useApiMutation` — the interceptor already handles it.

---

## TypeScript

Strict mode is on. All domain types live in `@/types/<domain>/`.

Standard pattern per domain:

```typescript
// types/customers/index.ts
export interface Customer { id: string; name: string; phone: string; }
export interface CustomerListResponse { count: number; results: Customer[]; }
export interface CreateCustomerPayload { phone: string; name?: string; }
export interface UpdateCustomerPayload { name?: string | null; }
```

Use generics when calling hooks: `useApiQuery<CustomerListResponse>(...)`.

---

## Navigation & Auth

- Use `useRouter()` from `next/navigation` for programmatic navigation.
- Use `<Link href="...">` for static links.
- Route groups: `(auth)` for public auth pages, `(dashboard)` for protected pages.
- Auth guard: check `useCurrentUser()` — returns `{ data, isAuthenticated, isLoading }`.
- Token is stored in `localStorage` under the key `authToken`. The axios interceptor handles injection. Do not read or write the token manually.
- On 401, the interceptor auto-logs out and redirects to `/login`.

---

## Key Files

| File | Purpose |
|---|---|
| `src/hooks/use-api.ts` | Axios instance, interceptors, `useApiQuery`, `useApiMutation` |
| `src/lib/utils.ts` | `cn()`, `getUserInitials()`, display formatters |
| `src/app/providers.tsx` | QueryClient, toast, theme providers |
| `src/lib/nav-items.ts` | Sidebar navigation structure |
| `components.json` | shadcn config (aliases, style, icon lib) |
| `src/lib/AntdRegistry.tsx` | SSR style extraction for antd |
| `src/context/ThemeContext.tsx` | Single antd `ConfigProvider` + theme config |

---

---

# Ant Design

Version in use: **antd ^5.21.0** (React 19 compatible via `@ant-design/v5-patch-for-react-19`).

> **Scope restriction:** Ant Design must only be used on **dashboard and internal tool pages where SEO is not a concern**. Do not use antd components on public-facing or marketing pages (landing pages, blog, product pages, etc.) — antd's CSS-in-JS runtime and lack of semantic HTML hurt crawlability and Core Web Vitals. For public pages, use Tailwind CSS and shadcn/ui instead.

---

## Ant Design — Setup & SSR

Next.js App Router needs antd styles injected server-side. The provider tree in [src/app/layout.tsx](src/app/layout.tsx) is:

```
LoadingProvider
  AntdRegistry          ← @ant-design/cssinjs StyleProvider (SSR style extraction)
    ThemeProvider       ← ConfigProvider + <App> (light/dark theme, feedback context)
      {children}
```

`AntdRegistry` ([src/lib/AntdRegistry.tsx](src/lib/AntdRegistry.tsx)) uses `createCache` + `useServerInsertedHTML` to flush critical CSS during SSR. Do not remove it or move it inside `ThemeProvider`.

---

## Ant Design — Theme

The single source of truth for the antd theme is **`ThemeProvider`** in [src/context/ThemeContext.tsx](src/context/ThemeContext.tsx).

```tsx
const appThemes: Record<AppThemeMode, ThemeConfig> = {
  light: {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: "#16a2a2",
      borderRadius: 8,
      fontFamily: "var(--font-jost), -apple-system, system-ui, sans-serif",
    },
  },
  dark: {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: "#20A67A",
      borderRadius: 8,
      fontFamily: "var(--font-jost), -apple-system, system-ui, sans-serif",
    },
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppThemeMode>("light");
  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={appThemes[mode]}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
```

**Rules:**
- There is **one** `ConfigProvider` in the app. Do not nest a second one inside a component to tweak colours — change `appThemes` instead.
- The `Sidebar` currently wraps its `Menu` in a local `ConfigProvider` override. This is a known issue to fix, not a pattern to copy.
- To read the current theme mode in a component, use the `useTheme()` hook:

```tsx
import { useTheme } from "@/context/ThemeContext";

const { mode, toggleMode } = useTheme();
```

---

## Ant Design — Feedback

**Always** obtain `message` (and `notification`, `modal`) from `App.useApp()`. Never call the static `message.success()` from antd directly — static calls bypass the theme context.

The `<App>` wrapper is already rendered inside `ThemeProvider`, so `App.useApp()` is available in every client component.

```tsx
import { App } from "antd";

export function MyComponent() {
  const { message } = App.useApp();

  const handleAction = async () => {
    try {
      await doSomething();
      message.success("Done.");
    } catch {
      message.error("Something went wrong.");
    }
  };
}
```

---

## Ant Design — Forms

### Hook & defaults

```tsx
import { Form, Input } from "antd";

interface MyFormValues {
  name: string;
  description?: string;
}

const [form] = Form.useForm<MyFormValues>();
```

Always type the form values with a generic so `form.getFieldValue` and `validateFields` return the correct type.

Default props for every `<Form>`:

```tsx
<Form
  form={form}
  layout="vertical"
  requiredMark={false}
  initialValues={{ ... }}
>
```

### Form.Item binding

```tsx
<Form.Item
  label="Product name"
  name="name"
  rules={[
    { required: true, message: "Enter a product name" },
    { pattern: /^[A-Za-z0-9](?:[A-Za-z0-9 -]*[A-Za-z0-9])?$/, message: "Letters, numbers, spaces, hyphens only." },
  ]}
>
  <Input size="large" placeholder="M-Pesa" />
</Form.Item>
```

### Nested items inside layout wrappers

When a `Form.Item` is inside a `Flex` or `Space` for layout purposes, use `noStyle` on the inner item so it does not render its own label/margin:

```tsx
<Form.Item label="Product" required>
  <Flex gap={8}>
    <Form.Item name="productId" noStyle rules={[{ required: true, message: "Select a product" }]}>
      <Select ... style={{ flex: 1 }} />
    </Form.Item>
    <Button icon={<Plus />} />
  </Flex>
</Form.Item>
```

### Multi-step validation

For wizard-style modals, validate only the fields on the current step:

```tsx
const stepFields: Array<Array<keyof MyFormValues>> = [
  ["productId", "icon"],
  ["market"],
  [],
];

const validateCurrentStep = async () => {
  await form.validateFields(stepFields[currentStep]);
  setCurrentStep((s) => s + 1);
};
```

### Reactive field reads

Use `Form.useWatch` to react to a field value without a controlled `onChange`:

```tsx
const selectedIcon = Form.useWatch("icon", form) ?? "api";
```

### Reset on close

Always reset the form when a modal closes:

```tsx
const handleCancel = () => {
  form.resetFields();
  onCancel();
};
```

---

## Ant Design — Modals

### Props checklist

| Prop | Rule |
|---|---|
| `open` | Controlled boolean — never use `visible` (removed in v5) |
| `centered` | Always set — keeps the modal vertically centred |
| `destroyOnHidden` | Set when the modal contains a form or heavy state; omit for purely display modals |
| `width` | Set explicitly (e.g. `520`, `420`); default is too narrow for forms |
| `footer` | Either `null` (build footer inside `<Form>`) or a JSX element |

### Footer patterns

**Option A — footer inside the form body** (used by `CreateProjectModal`):

```tsx
<Modal footer={null} ...>
  <Form ...>
    {/* step content */}
    <Flex align="center" justify="space-between">
      <Text type="secondary">Step {currentStep + 1} of 3</Text>
      <Space>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button type="primary" onClick={next}>Next</Button>
      </Space>
    </Flex>
  </Form>
</Modal>
```

**Option B — footer prop** (used by `UploadResultsModal`):

```tsx
const footer = (
  <Flex gap={8} justify="flex-end">
    <Button onClick={handleClose}>Cancel</Button>
    <Button type="primary" loading={isLoading} onClick={handleSubmit}>
      Submit
    </Button>
  </Flex>
);

<Modal footer={footer} ...>
  {/* content */}
</Modal>
```

---

## Ant Design — Tables

**Never use antd `Table` directly.** Always use the project wrapper `BaseTable` from `@/components`:

```tsx
import { BaseTable } from "@/components";
import type { ColumnsType } from "antd/es/table";

interface Row {
  id: string;
  name: string;
  status: string;
}

const columns: ColumnsType<Row> = [
  { title: "Name", dataIndex: "name", key: "name" },
  { title: "Status", dataIndex: "status", key: "status" },
];

<BaseTable<Row>
  rowKey="id"
  dataSource={rows}
  columns={columns}
  loading={isLoading}
/>
```

`BaseTable` automatically adds `showSizeChanger: true` and `pageSizeOptions: ["10", "25", "50", "100"]` to the pagination. Pass `pagination={false}` to suppress it entirely.

---

## Ant Design — Layout & Sidebar

The sidebar uses `Layout.Sider` on desktop and switches to an antd `Drawer` on mobile (`window.innerWidth < 1024`). Both render the same `SidebarContent` JSX.

```tsx
const { Sider } = Layout;

// Desktop
<Sider
  trigger={null}
  collapsible
  collapsed={sidebarCollapsed}
  width={248}
  collapsedWidth={76}
>
  {SidebarContent}
</Sider>

// Mobile
<Drawer
  placement="left"
  closable={false}
  open={!sidebarCollapsed}
  onClose={toggleSidebar}
  width={280}
  styles={{ body: { padding: 0 } }}
>
  {SidebarContent}
</Drawer>
```

### Menu

```tsx
<Menu
  mode="inline"
  selectedKeys={[pathname]}   // highlights the active route
  items={mapMenuItems(menuData)}
  inlineIndent={20}
  style={{ borderRight: 0, background: "transparent" }}
/>
```

Build the `items` array from a data structure rather than JSX children. Each leaf item uses a Next.js `<Link>` as its label:

```tsx
{
  key: item.path,
  icon: item.icon,
  label: <Link href={item.path}>{item.label}</Link>,
}
```

---

## Ant Design — Typography

```tsx
import { Typography } from "antd";

const { Text, Title } = Typography;

// Heading
<Title level={5} style={{ margin: 0 }}>Section heading</Title>

// Body / secondary
<Text type="secondary">Supporting copy</Text>

// Inline strong
<Text strong>{value}</Text>
```

Do not use raw `<h1>`–`<h6>` or `<p>` tags for content that sits inside antd surfaces — use `Typography` so colour and font follow the theme.

---

## Ant Design — Layout Primitives

### Flex

Use `Flex` for single-axis alignment:

```tsx
<Flex align="center" justify="space-between" gap={8}>
  <Text>Label</Text>
  <Button>Action</Button>
</Flex>
```

### Space

Use `Space` for a list of items with consistent gaps:

```tsx
<Space direction="vertical" size={12} style={{ width: "100%" }}>
  <Form.Item .../>
  <Form.Item .../>
</Space>

<Space wrap size={6}>
  {tags.map(t => <Tag key={t}>{t}</Tag>)}
</Space>
```

### Card

Use `size="small"` for compact bordered containers inside modals or panels:

```tsx
<Card size="small">
  {/* row content */}
</Card>
```

---

## Ant Design — Import Conventions

```tsx
// Correct — single top-level import
import { Button, Form, Input, Modal, Select, Table, Typography } from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";

// Wrong — sub-path imports
import Button from "antd/es/button";        // banned
import Button from "antd/lib/button";       // banned
```

Icons come from `lucide-react`, not `@ant-design/icons`:

```tsx
import { Plus, Trash2, ChevronRight } from "lucide-react";

<Button icon={<Plus className="h-4 w-4" />} />
```

Destructure sub-components at the top of the file, not inline:

```tsx
const { Text, Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Sider } = Layout;
```
