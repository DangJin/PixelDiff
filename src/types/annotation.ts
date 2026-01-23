export type AnnotationTool = 'select' | 'arrow' | 'rect' | 'circle';

export interface BaseAnnotation {
  id: string;
  type: 'arrow' | 'rect' | 'circle';
  color: string;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: 'circle';
  centerX: number;
  centerY: number;
  radius: number;
}

export type Annotation = ArrowAnnotation | RectAnnotation | CircleAnnotation;

export const ANNOTATION_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export const DEFAULT_ANNOTATION_COLOR = '#ef4444';
