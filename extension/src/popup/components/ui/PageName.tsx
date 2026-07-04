import { useRouter } from "../../hooks/useRouter";
import { Icon } from "@iconify/react";

/**
 * Screen title row: left-aligned title with an inline back arrow and an
 * optional right-side hint (e.g. "6 items"), matching the promo layout.
 */
export const PageName = ({
  name,
  back,
  hint,
}: {
  name: string;
  back?: boolean;
  hint?: string;
}) => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {back && (
          <button onClick={() => router.back()} title="Back">
            <Icon icon="lucide:arrow-left" className="text-xl text-tertiary hover:text-primary transition-colors" />
          </button>
        )}
        <h1 className="text-base font-bold text-primary">{name}</h1>
      </div>
      {hint && <span className="text-xs font-semibold text-tertiary">{hint}</span>}
    </div>
  );
};
