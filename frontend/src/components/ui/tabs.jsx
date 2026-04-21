"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

/**
 * Кореневий компонент системи вкладок (Tabs), побудований на примітивах Radix UI.
 * * Служить контейнером для управління станом активної вкладки.
 * Використовується для перемикання між категоріями бібліотеки або різними
 * представленнями аналітичних даних.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи для корегування макета.
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>} props.props - Стандартні атрибути Radix UI Tabs Root.
 * @returns {React.JSX.Element} Контейнер управління вкладками.
 */
function Tabs({ className, ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

/**
 * Контейнер для перемикачів вкладок (Triggers).
 * * Забезпечує візуальне групування кнопок перемикання та їх стилізацію як єдиного блоку меню.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи.
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>} props.props - Атрибути списку вкладок.
 * @returns {React.JSX.Element} Рендерить стилізований список перемикачів.
 */
function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Інтерактивний перемикач для конкретної вкладки.
 * * Реалізує логіку вибору активного контенту та має виражені стани для активного,
 * неактивного та заблокованого (disabled) режимів.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи.
 * @param {string} props.value - Унікальне значення вкладки, що пов'язує тригер із контентом.
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>} props.props - Атрибути тригера вкладки.
 * @returns {React.JSX.Element} Кнопка-перемикач.
 */
function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-card dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Контейнер для вмісту вкладки.
 * * Відображається лише тоді, коли відповідний `TabsTrigger` із таким самим
 * значенням `value` є активним. Використовується для рендерингу списків книг
 * або графіків статистики.
 * * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} [props.className] - Додаткові CSS-класи.
 * @param {string} props.value - Значення, що ідентифікує контент вкладки.
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>} props.props - Атрибути вмісту вкладки.
 * @returns {React.JSX.Element} Панель із контентом.
 */
function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
