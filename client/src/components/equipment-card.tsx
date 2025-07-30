import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Equipment } from "@shared/schema";
import { useState } from "react";

interface EquipmentCardProps {
  equipment: Equipment;
  onSelectDates: (equipmentId: string) => void;
}

export default function EquipmentCard({
  equipment,
  onSelectDates,
}: EquipmentCardProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleImageClick = () => {
    if (equipment.imageUrl) {
      setIsImageModalOpen(true);
    }
  };

  return (
    <>
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0" aria-describedby="image-dialog-description">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg font-semibold">{equipment.name}</DialogTitle>
            <p id="image-dialog-description" className="sr-only">Zvětšený obrázek vybavení {equipment.name}</p>
          </DialogHeader>
          <div className="relative overflow-hidden">
            {equipment.imageUrl && (
              <img
                src={equipment.imageUrl}
                alt={equipment.name}
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white">
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="relative md:w-64 md:flex-shrink-0">
          <div className="aspect-[4/3] md:aspect-[3/2] overflow-hidden bg-gray-100">
            {equipment.imageUrl ? (
              <img
                src={equipment.imageUrl}
                alt={equipment.name}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleImageClick}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const nextElement = e.currentTarget
                    .nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500"
              style={{ display: equipment.imageUrl ? "none" : "flex" }}
            >
              <span className="text-sm">Chybička se vloudila..</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between h-full">
            {/* Left Content */}
            <div className="flex-1 md:pr-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 tracking-wide">
                {equipment.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3 tracking-wide">
                {equipment.description}
              </p>
            </div>

            {/* Right Content - Pricing and Actions */}
            <div className="md:min-w-[160px] md:flex-shrink-0 mt-4 md:mt-0 flex flex-col items-center md:items-end">
              {/* Simple pricing display */}
              <div className="mb-4 text-center md:text-right">
                <div className="text-lg font-semibold text-gray-900">
                  od{" "}
                  {formatPrice(
                    Math.min(
                      equipment.price1to3Days,
                      equipment.price4to7Days,
                      equipment.price8PlusDays,
                    ),
                  )}{" "}
                  / den
                </div>
              </div>

              <Button
                onClick={() => onSelectDates(equipment.id.toString())}
                size="sm"
                className="w-50 h-9 text-sm bg-teal-800 hover:bg-teal-900 text-white"
              >
                <Calendar className="mr-1 h-4 w-4" />
                Vybrat termín
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
    </>
  );
}
