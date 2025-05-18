"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dish } from "../../public/data/dishes";

interface RecipeModalProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  dish: Dish;
}

export const RecipeModal = ({ open, onOpenChange, dish }: RecipeModalProps) => {
  if (!dish?.recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg relative overflow-hidden">
        <span className="absolute text-[120px] opacity-10 right-5 select-none pointer-events-none">
          👨🏻‍🍳
        </span>

        <DialogHeader>
          <DialogTitle>🍽️ {dish.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto relative z-10">
          <div>
            <p className="text-gray-600 text-sm mb-2 italic">
              Here&apos;s how you make {dish.name} — straight from {dish.country}.
            </p>
            <p className="font-semibold">Ingredients:</p>
            <ul className="list-disc list-inside text-gray-700">
              {dish.recipe.ingredients.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Instructions:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-1">
              {dish.recipe.instructions.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
