/**
 * Type declarations for the BarcodeDetector API (Web Incubator).
 * Part of the Web Incubator Community Group (WICG) — not yet in standard TS lib.dom.d.ts.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
 */

interface BarcodeDetectorOptions {
    formats?: BarcodeFormat[];
}

type BarcodeFormat =
    | "aztec"
    | "code_128"
    | "code_39"
    | "code_93"
    | "codabar"
    | "data_matrix"
    | "ean_13"
    | "ean_8"
    | "itf"
    | "pdf417"
    | "qr_code"
    | "upc_a"
    | "upc_e";

interface DetectedBarcode {
    boundingBox: DOMRectReadOnly;
    rawValue: string;
    format: BarcodeFormat;
    cornerPoints: { x: number; y: number }[];
}

declare class BarcodeDetector {
    constructor(options?: BarcodeDetectorOptions);
    static getSupportedFormats(): Promise<BarcodeFormat[]>;
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}
