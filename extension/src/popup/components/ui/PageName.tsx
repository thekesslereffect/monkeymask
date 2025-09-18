import { useRouter } from "../../hooks/useRouter";
import { Icon } from "@iconify/react";

export const PageName = ({ name, back }: { name: string, back?: boolean }) => {
  const router = useRouter();

  return (
    <div className="flex items-center w-full text-2xl font-bold">
      <div className="flex items-center justify-start w-8">
        {back && (
          <button onClick={() => router.back()}>
            <Icon icon="lucide:arrow-left" className="text-2xl text-tertiary" />
          </button>
        )}
      </div>
      <h1 className="flex-1 text-2xl font-bold text-center text-primary">{name}</h1>
      <div className="flex items-center justify-end w-8">
        {/* Empty div to balance the layout */}
      </div>
    </div>
  );
};