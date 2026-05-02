import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, ScanLine, AlertCircle, ImageUp } from 'lucide-react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Scan = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Scan Report Card — EduBel';
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        tick();
      }
    } catch (e) {
      setError('Cannot access camera. Use the upload option below or grant camera permission.');
    }
  };

  const stopCamera = () => {
    setScanning(false);
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleQrFound = (data: string) => {
    stopCamera();
    try {
      const url = new URL(data);
      // Send to /verify with same hash params
      navigate(`/verify${url.hash}`);
    } catch {
      // Not a URL — treat as fake/unknown
      navigate('/verify');
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          handleQrFound(code.data);
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleFileUpload = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(data.data, data.width, data.height);
      if (code?.data) handleQrFound(code.data);
      else setError('No QR code found in the image. Try a clearer photo.');
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-sm font-medium hover:opacity-80">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-base font-semibold">Scan Report Card</h1>
      </header>

      <main className="flex-1 p-4 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" /> Point camera at the QR code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              {scanning && (
                <div className="pointer-events-none absolute inset-6 border-2 border-primary/80 rounded-lg">
                  <div className="absolute left-0 right-0 h-0.5 bg-primary animate-[scanline_2s_linear_infinite]" />
                </div>
              )}
              {!scanning && !error && (
                <div className="absolute inset-0 flex items-center justify-center text-white/80">
                  <Camera className="h-10 w-10 animate-pulse" />
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <ImageUp className="h-4 w-4" /> Upload photo of report card
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
              />
              {!scanning && (
                <Button onClick={startCamera} className="gap-2">
                  <Camera className="h-4 w-4" /> Retry camera
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Original cards show ✓ Original. Edited or copied QRs show ⚠ Tampered.
            </p>
          </CardContent>
        </Card>
      </main>

      <style>{`@keyframes scanline { 0% { top: 0%; } 100% { top: 100%; } }`}</style>
    </div>
  );
};

export default Scan;
