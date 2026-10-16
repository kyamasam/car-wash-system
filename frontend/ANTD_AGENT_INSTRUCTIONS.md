# Ant Design v5 — Agent Instructions

These instructions tell an AI agent how to use Ant Design (antd v5) correctly in a Next.js App Router project. Follow them exactly. Do not deviate from these patterns.

---

## 1. Setup & SSR Wiring

The root `layout.tsx` must wrap the app in this exact order:

```tsx
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ThemeProvider } from "@/providers/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AntdRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

`AntdRegistry` (from `@ant-design/nextjs-registry`) handles SSR style extraction. It must be the outermost antd wrapper.

---

## 2. Theme

- Define a single `ConfigProvider` inside a `ThemeProvider` component.
- Store light/dark theme tokens in an `appThemes` object in that same file.
- Expose `mode` (and optionally `setMode`) via a `useTheme()` context hook.
- **Never** add a second `ConfigProvider` anywhere else in the tree.
- Wrap children with antd's `<App>` component **inside** the `ConfigProvider` so feedback APIs work globally.

```tsx
// providers/ThemeProvider.tsx
"use client";
import { ConfigProvider, App, theme } from "antd";
import { createContext, useContext, useState } from "react";

const appThemes = {
  light: { token: { colorPrimary: "#1677ff" } },
  dark:  { token: { colorPrimary: "#1677ff" }, algorithm: theme.darkAlgorithm },
};

const ThemeCtx = createContext({ mode: "light", setMode: (_: string) => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState<"light" | "dark">("light");
  return (
    <ThemeCtx.Provider value={{ mode, setMode }}>
      <ConfigProvider theme={appThemes[mode]}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeCtx.Provider>
  );
}
```

---

## 3. Feedback (Messages, Notifications, Modals)

Always use `App.useApp()`. Never call static methods like `message.success()`.

```tsx
"use client";
import { App } from "antd";

export function MyComponent() {
  const { message, notification, modal } = App.useApp();

  const handleClick = () => {
    message.success("Done!");
  };
}
```

`<App>` is already in `ThemeProvider`. Do not add another `<App>` wrapper.

---

## 4. Forms

- Use `Form.useForm<T>()` for typed form instances.
- Default layout: `layout="vertical"` and `requiredMark={false}`.
- Use `Form.Item` with `name`, `label`, and `rules`.
- Use `noStyle` for inline/nested items that should not render a label or margin.
- Use `Form.useWatch()` to reactively read a field value.
- Call `form.resetFields()` in the modal/drawer `onCancel` handler.
- For multi-step forms, validate a subset with `form.validateFields(["field1", "field2"])`.

```tsx
const [form] = Form.useForm<{ name: string; email: string }>();
const name = Form.useWatch("name", form);

<Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit}>
  <Form.Item name="name" label="Name" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
  <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
    <Input />
  </Form.Item>
</Form>
```

---

## 5. Modals

- Control with an `open: boolean` prop.
- Always set `centered`, `destroyOnHidden`, and an explicit `width`.
- Either use `footer={null}` with a manual footer inside the body, or pass a `footer` prop with `<Flex justify="flex-end" gap={8}>`.
- Reset form and local state in `onCancel`.

```tsx
<Modal
  open={open}
  onCancel={() => { form.resetFields(); onClose(); }}
  centered
  destroyOnHidden
  width={520}
  footer={
    <Flex justify="flex-end" gap={8}>
      <Button onClick={onClose}>Cancel</Button>
      <Button type="primary" onClick={handleSubmit}>Save</Button>
    </Flex>
  }
>
  {/* form here */}
</Modal>
```

---

## 6. Tables

- **Never** use the raw antd `Table` component directly.
- Use a shared `BaseTable<T>` wrapper that applies standard pagination, loading, and empty-state props.
- Define columns with `ColumnsType<T>` from antd.

```tsx
import { BaseTable } from "@/components";
import type { ColumnsType } from "antd/es/table";

const columns: ColumnsType<User> = [
  { title: "Name", dataIndex: "name", key: "name" },
  { title: "Email", dataIndex: "email", key: "email" },
];

<BaseTable<User> columns={columns} dataSource={users} rowKey="id" loading={isLoading} />
```

---

## 7. Layout & Sidebar

- Use `Layout.Sider` for desktop and `Drawer` for mobile, switching on a breakpoint.
- Use `Menu` with `mode="inline"`, `selectedKeys={[pathname]}`, and an `items` array built from data.
- Do not nest a second `ConfigProvider` inside the sidebar.

```tsx
<Layout.Sider breakpoint="lg" collapsedWidth={0}>
  <Menu
    mode="inline"
    selectedKeys={[pathname]}
    items={navItems.map((item) => ({
      key: item.href,
      icon: item.icon,
      label: <Link href={item.href}>{item.label}</Link>,
    }))}
  />
</Layout.Sider>
```

---

## 8. Typography

- Destructure `Text` and `Title` from `Typography`.
- Use `type="secondary"` for muted/helper text.
- Use `Title level={n}` for semantic heading hierarchy.

```tsx
import { Typography } from "antd";
const { Text, Title } = Typography;

<Title level={3}>Section Heading</Title>
<Text type="secondary">Helper text</Text>
```

---

## 9. Layout Primitives

| Component | Use case |
|-----------|----------|
| `Flex` | Single-axis alignment (row/column with gap, align, justify) |
| `Space` | Stacked groups with consistent spacing |
| `Card size="small"` | Bordered containers / metric tiles |

```tsx
<Flex justify="space-between" align="center" gap={8}>
  <Text>Label</Text>
  <Button>Action</Button>
</Flex>
```

---

## 10. Import Conventions

- **All imports from `"antd"` top-level.** Sub-path imports like `antd/es/button` are banned.
- Icons come from `lucide-react`, not `@ant-design/icons`.

```tsx
// Correct
import { Button, Form, Table, Typography, Flex } from "antd";
import { PlusCircle } from "lucide-react";

// Wrong — never do this
import Button from "antd/es/button";
import { PlusCircleOutlined } from "@ant-design/icons";
```

---

## Quick Reference Checklist

Before shipping any antd component, verify:

- [ ] No second `ConfigProvider` added
- [ ] Feedback uses `App.useApp()`, not static `message.*`
- [ ] Forms use `Form.useForm<T>()` with `layout="vertical"` and `requiredMark={false}`
- [ ] Modals have `centered`, `destroyOnHidden`, explicit `width`, and reset state in `onCancel`
- [ ] Tables go through `BaseTable`, not raw `antd Table`
- [ ] All imports from `"antd"` top-level; icons from `lucide-react`
