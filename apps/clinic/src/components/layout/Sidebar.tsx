import { NavLink as MantineNavLink, Stack } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  readonly label: string;
  readonly to: string;
}

/**
 * Itens de navegação da sidebar. "Pacientes" chega na PSI-033, "Agenda" na
 * PSI-035; "Configurações" (PSI-039, última feature do app clinic) fecha o
 * escopo — página permanente para revisar/editar o que o onboarding definiu.
 */
const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", to: "/" },
  { label: "Agenda", to: "/agenda" },
  { label: "Pacientes", to: "/pacientes" },
  { label: "Configurações", to: "/configuracoes" },
];

/** Lista de navegação da sidebar, usada pelo shell de layout das rotas protegidas. */
export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <Stack gap={4}>
      {NAV_ITEMS.map((item) => (
        <MantineNavLink
          key={item.to}
          component={Link}
          to={item.to}
          label={item.label}
          active={item.to === "/" ? pathname === item.to : pathname.startsWith(item.to)}
        />
      ))}
    </Stack>
  );
}
