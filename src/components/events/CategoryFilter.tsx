
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onCategorySelect,
  categoryCounts 
}: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-center mb-8">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        onClick={() => onCategorySelect(null)}
        className="rounded-full"
      >
        All Templates
        <Badge variant="secondary" className="ml-2">
          {Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)}
        </Badge>
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          onClick={() => onCategorySelect(category)}
          className="rounded-full"
        >
          {category}
          <Badge variant="secondary" className="ml-2">
            {categoryCounts[category] || 0}
          </Badge>
        </Button>
      ))}
    </div>
  );
};
