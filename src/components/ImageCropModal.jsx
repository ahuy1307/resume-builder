import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage";
import { X, ZoomIn, ZoomOut } from "lucide-react";

export default function ImageCropModal({ src, shape = "circle", onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageBase64 = await getCroppedImg(src, croppedAreaPixels, 0);
      onComplete(croppedImageBase64);
    } catch (e) {
      console.error(e);
      onCancel();
    }
  };

  return (
    <div className="rv-modal-overlay">
      <div className="rv-modal rv-crop-modal">
        <div className="rv-modal-header">
          <h3>Edit Photo</h3>
          <button className="rv-modal-close" onClick={onCancel}><X size={18} /></button>
        </div>

        <div className="rv-crop-container">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape={shape === "circle" ? "round" : "rect"}
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="rv-crop-controls">
          <div className="rv-zoom-slider-wrap">
            <button className="rv-zoom-btn" onClick={() => setZoom(z => Math.max(1, z - 0.1))}><ZoomOut size={16} /></button>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="rv-zoom-slider"
            />
            <button className="rv-zoom-btn" onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn size={16} /></button>
          </div>
        </div>

        <div className="rv-modal-actions">
          <button className="rv-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="rv-btn-danger" style={{ backgroundColor: "#2563eb", color: "#fff" }} onClick={handleSave}>Save Photo</button>
        </div>
      </div>
    </div>
  );
}
