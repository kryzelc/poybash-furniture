"use client";

interface Category {
  id: number;
  name: string;
  imageUrl: string;
  count: number;
}

interface CategoriesProps {
  categories: Category[];
  onCategoryClick: (name: string) => void;
}

export function Categories({ categories, onCategoryClick }: CategoriesProps) {
  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-secondary/20">
      <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-16">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2>Shop by Category</h2>
          <p className="text-muted-foreground mt-2 sm:mt-3 lg:mt-4">
            Explore our furniture collections
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 xl:gap-10 max-w-6xl mx-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.name)}
              className="group relative overflow-hidden rounded-lg cursor-pointer text-left"
            >
              <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden">
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 xl:p-10">
                  <h3 className="text-white mb-1">{category.name}</h3>
                  <p className="text-white/80 text-sm sm:text-base">
                    {category.count} Products
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
