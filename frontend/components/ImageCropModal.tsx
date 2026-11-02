'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import Modal from './Modal';
import { getCroppedImg } from '@/libs/imageUtils';
import { Loader2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface ImageCropModalProps {
    isOpen: boolean;
    imageSrc: string | null;
    cropShape?: 'round' | 'rect';
    aspect?: number;
    title?: string;
    maxOutputWidth?: number;
    maxOutputHeight?: number;
    fileName?: string;
    onClose: () => void;
    onCropComplete: (croppedFile: File) => Promise<void> | void;
}

export default function ImageCropModal({
    isOpen,
    imageSrc,
    cropShape = 'round',
    aspect = 1,
    title,
    maxOutputWidth = 600,
    maxOutputHeight = 600,
    fileName = 'cropped.webp',
    onClose,
    onCropComplete,
}: ImageCropModalProps) {
    const { language } = useLanguage();
    const isRu = language === 'ru';

    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (newCrop: Point) => {
        setCrop(newCrop);
    };

    const onZoomChange = (newZoom: number) => {
        setZoom(newZoom);
    };

    const handleCropAreaComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
        setCroppedAreaPixels(currentCroppedAreaPixels);
    }, []);

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedFile = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                {
                    maxWidth: maxOutputWidth,
                    maxHeight: maxOutputHeight,
                    quality: 0.88,
                    fileName,
                }
            );

            await onCropComplete(croppedFile);
            onClose();
        } catch (error) {
            console.error('Failed to crop and save image:', error);
            alert(isRu ? 'Не удалось обработать изображение' : 'Failed to crop image');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageSrc) return null;

    const defaultTitle = cropShape === 'round' 
        ? (isRu ? 'Кадрирование аватара' : 'Crop Avatar') 
        : (isRu ? 'Кадрирование баннера' : 'Crop Banner');

    return (
        <Modal
            isOpen={isOpen}
            onClose={isProcessing ? () => {} : onClose}
            className="w-full max-w-[540px] mx-4 bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-neutral-100 flex flex-col light:bg-white light:border-zinc-200 light:text-zinc-900"
        >
            <div className="flex items-center justify-between pb-4 border-b border-white/5 light:border-zinc-200/80">
                <h3 className="text-sm sm:text-base font-bold text-zinc-100 light:text-zinc-900">
                    {title || defaultTitle}
                </h3>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition disabled:opacity-40 cursor-pointer light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="relative w-full h-[280px] sm:h-[340px] mt-4 rounded-2xl overflow-hidden bg-black/90 border border-white/10 select-none">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    cropShape={cropShape}
                    showGrid={cropShape === 'rect'}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={handleCropAreaComplete}
                    classes={{
                        containerClassName: 'rounded-2xl',
                    }}
                />
            </div>

            <div className="mt-4 px-1 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
                    disabled={zoom <= 1 || isProcessing}
                    className="p-1.5 text-zinc-400 hover:text-white transition disabled:opacity-30 cursor-pointer light:text-zinc-500 light:hover:text-zinc-900"
                    title={isRu ? 'Уменьшить' : 'Zoom out'}
                >
                    <ZoomOut size={16} />
                </button>

                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.02}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    disabled={isProcessing}
                    aria-label={isRu ? 'Масштаб' : 'Zoom'}
                    className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white light:bg-zinc-200 light:accent-zinc-900"
                />

                <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
                    disabled={zoom >= 3 || isProcessing}
                    className="p-1.5 text-zinc-400 hover:text-white transition disabled:opacity-30 cursor-pointer light:text-zinc-500 light:hover:text-zinc-900"
                    title={isRu ? 'Увеличить' : 'Zoom in'}
                >
                    <ZoomIn size={16} />
                </button>

                <button
                    type="button"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition disabled:opacity-30 cursor-pointer ml-1 light:text-zinc-500 light:hover:text-zinc-900 light:hover:bg-zinc-100"
                    title={isRu ? 'Сбросить' : 'Reset'}
                >
                    <RotateCcw size={15} />
                </button>
            </div>

            <p className="text-[11px] text-zinc-500 mt-2 px-1 light:text-zinc-600">
                {isRu 
                    ? 'Перетаскивайте изображение для центрирования или используйте ползунок для масштабирования' 
                    : 'Drag to position and use the slider to zoom'}
            </p>

            <div className="flex gap-2.5 mt-5">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition disabled:opacity-50 cursor-pointer light:bg-zinc-100 light:text-zinc-800 light:hover:bg-zinc-200 light:border light:border-zinc-200"
                >
                    {isRu ? 'Отмена' : 'Cancel'}
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm light:bg-zinc-900 light:text-white light:hover:bg-zinc-800"
                >
                    {isProcessing && <Loader2 size={14} className="animate-spin" />}
                    {isProcessing ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Применить' : 'Apply')}
                </button>
            </div>
        </Modal>
    );
}
