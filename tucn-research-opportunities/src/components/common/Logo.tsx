interface Props {
  large?: boolean;
  light?: boolean;
}

export default function Logo({ large = false, light = false }: Props) {
  const size = large ? 'w-14 h-14' : 'w-9 h-9';
  const imgSize = large ? 'h-10 w-10' : 'h-6 w-6';
  const bg = light ? 'bg-white/15' : 'bg-white';
  return (
    <div className={`${size} ${bg} flex items-center justify-center rounded-lg flex-shrink-0 shadow-sm`}>
      <img src="/favicon.svg" alt="UTCN Logo" className={`${imgSize} object-contain`} />
    </div>
  );
}
