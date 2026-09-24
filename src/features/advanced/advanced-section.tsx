import { ProductExclusionsCard } from "@/features/advanced/product-exclusions"

// Settings that only need touching when the automatic behaviour gets something
// wrong. One card per setting, stacked the way Витрати stacks its cards.
export function AdvancedSection() {
  return (
    <div className="flex flex-col gap-4">
      <ProductExclusionsCard />
    </div>
  )
}
