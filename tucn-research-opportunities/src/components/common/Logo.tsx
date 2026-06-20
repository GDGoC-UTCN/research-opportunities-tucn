interface Props {
  large?: boolean;
  light?: boolean;
}

export default function Logo({ large = false, light = false }: Props) {
  const size = large ? 'w-24 h-14' : 'w-24 h-10';
  const imgSize = large ? 'h-10 w-20' : 'h-7 w-20';
  const bg = light ? 'bg-white/15' : 'bg-white';
  return (
    <div className={`${size} ${bg} flex items-center justify-center rounded-lg flex-shrink-0 shadow-sm`}>
      <img src="/airi.svg" alt="AIRi@UTCN" className={`${imgSize} object-contain`} />
    </div>
  );
}
