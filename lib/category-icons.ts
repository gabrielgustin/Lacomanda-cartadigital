import {
  Baby,
  Beef,
  Beer,
  Cake,
  Coffee,
  Cookie,
  CupSoda,
  Fish,
  IceCreamCone,
  Martini,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  Wine,
  type LucideIcon,
} from 'lucide-react'

// Íconos que el backoffice ofrece para las categorías. La clave es lo que se guarda.
export const categoryIcons: Record<string, { label: string; Icon: LucideIcon }> = {
  utensils: { label: 'Cubiertos', Icon: Utensils },
  sandwich: { label: 'Sándwich', Icon: Sandwich },
  pizza: { label: 'Pizza', Icon: Pizza },
  salad: { label: 'Ensalada', Icon: Salad },
  beef: { label: 'Carne', Icon: Beef },
  fish: { label: 'Pescado', Icon: Fish },
  soup: { label: 'Sopa', Icon: Soup },
  wine: { label: 'Vino', Icon: Wine },
  martini: { label: 'Trago', Icon: Martini },
  beer: { label: 'Cerveza', Icon: Beer },
  coffee: { label: 'Café', Icon: Coffee },
  cake: { label: 'Postre', Icon: Cake },
  'ice-cream': { label: 'Helado', Icon: IceCreamCone },
  cookie: { label: 'Galletita', Icon: Cookie },
  baby: { label: 'Infantil', Icon: Baby },
  'cup-soda': { label: 'Gaseosa', Icon: CupSoda },
}

export const getCategoryIcon = (key: string): LucideIcon => categoryIcons[key]?.Icon ?? Utensils
