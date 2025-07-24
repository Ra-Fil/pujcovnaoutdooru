import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, QrCode } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  qrCodeUrl?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  orderNumber,
  qrCodeUrl,
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Rezervace odeslána!</DialogTitle>
          </div>
        </DialogHeader>

        <div className="text-center space-y-6">
          <p className="text-gray-600">
            Vaše objednávka byla úspěšně odeslána. Na email vám bude zasláno potvrzení a QR kód pro platbu.
          </p>

          {/* QR Code
          {qrCodeUrl ? (
            <div className="bg-gray-100 p-6 rounded-lg">
              <img
                src={qrCodeUrl}
                alt="QR kód pro platbu"
                className="w-32 h-32 mx-auto border-2 border-gray-300"
              />
              <p className="text-sm text-gray-600 mt-2">QR kód pro platbu</p>
            </div>
          ) : (
            <div className="bg-gray-100 p-6 rounded-lg">
              <div className="w-32 h-32 border-2 border-gray-300 mx-auto flex items-center justify-center bg-white">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-2">QR kód pro platbu</p>
            </div>
          )}
          */}

          <div className="text-sm text-gray-600">
            <p>
              <strong>Číslo objednávky:</strong> #{orderNumber}
            </p>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Zavřít
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
