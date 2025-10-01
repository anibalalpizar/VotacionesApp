"use client"

import type * as React from "react"
import {
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Vote,
  BarChart3,
  UserPlus,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { User } from "@/lib/types"

// This is sample data.
const data = {
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
          adminOnly: true, 
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
  ],
}
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const userData = {
    name: user.fullName,
    email: user.email,
    avatar: "utn.jpg",
  }

  const filteredNavMain = data.navMain.map(section => {
    if (section.items) {
      return {
        ...section,
        items: section.items.filter(item => {
          if (item.adminOnly && user.role !== "ADMIN") {
            return false
          }
          return true
        })
      }
    }
    return section
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
