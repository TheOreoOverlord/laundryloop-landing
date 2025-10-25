interface CalEmbedProps {
  src: string;
  height?: number;
}

export default function CalEmbed({ src, height = 700 }: CalEmbedProps) {
  return (
    <iframe
      src={src}
      style={{ width: '100%', height: `${height}px`, border: 'none' }}
      allow="camera; microphone; fullscreen"
    />
  );
}