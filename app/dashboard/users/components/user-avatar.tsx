import Image from "next/image";

interface UserAvatarProps {
  name: string | null;
  email: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const getInitials = (label: string) =>
  label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export const UserAvatar = ({ name, email, photoUrl, size = "md" }: UserAvatarProps) => {
  const label = name ?? email;
  const initials = getInitials(label);
  const sizeClass =
    size === "sm" ? "size-8 text-[10px]" :
    size === "lg" ? "size-16 text-lg" :
    "size-9 text-xs";

  if (photoUrl) {
    return (
      <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full`}>
        <Image src={photoUrl} alt={label} width={64} height={64} className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full bg-brand-gradient flex items-center justify-center font-semibold text-white`}
    >
      {initials}
    </div>
  );
};

