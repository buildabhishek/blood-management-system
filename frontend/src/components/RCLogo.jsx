export default function RCLogo({ size = 48, className = '' }) {
  return (
    <img src="/RCLogo.png" alt="RC Foundation" width={size} height={size}
      className={className} style={{ objectFit: 'contain' }} />
  );
}
