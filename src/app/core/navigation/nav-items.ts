export interface NavItem {
  label: string;
  icon: string;   // classe primeicons (ex: 'pi pi-home')
  route: string;
}

export const NAV_ITEMS_UPPER: NavItem[] = [
  { label: 'Entrainement',  icon: 'pi pi-heart',       route: '/entrainement' },
  { label: 'Activity',   icon: 'pi pi-bolt',       route: '/activity'  },
  { label: 'Historique', icon: 'pi pi-history',    route: '/history'   },
];

export const NAV_ITEMS_LOWER: NavItem[] = [
  { label: 'Settings',   icon: 'pi pi-cog',        route: '/settings'  }
];
