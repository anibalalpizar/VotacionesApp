"use client"

import type * as React from "react"
import { Frame, Map, PieChart, Settings2, SquareTerminal, Vote, BarChart3, UserPlus } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Sistema de Votación UTN",
      logo: Vote,
      plan: "Administración",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Elecciones",
      url: "#",
      icon: Vote,
      items: [
        {
          title: "Ver Elecciones",
          url: "/dashboard/elections",
        },
        {
          title: "Crear Elección",
          url: "/dashboard/elections/create",
        },
        {
          title: "Resultados",
          url: "/dashboard/elections/results",
        },
      ],
    },
    {
      title: "Votantes",
      url: "#",
      icon: UserPlus,
      items: [
        {
          title: "Registrar Votante",
          url: "/dashboard/voters/register",
        },
        {
          title: "Ver Candidatos",
          url: "/dashboard/candidates",
        },
      ],
    },
    {
      title: "Reportes",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Estadísticas",
          url: "/dashboard/reports/stats",
        },
        {
          title: "Auditoría",
          url: "/dashboard/reports/audit",
        },
        {
          title: "Exportar Datos",
          url: "/dashboard/reports/export",
        },
      ],
    },
    {
      title: "Configuración",
      url: "/dashboard/settings",
      icon: Settings2,
    },
  ],
  projects: [
    {
      name: "Elección Presidencial 2024",
      url: "#",
      icon: Frame,
    },
    {
      name: "Elección Estudiantil",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Consulta Popular",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
