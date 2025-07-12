import { IoMegaphone } from "react-icons/io5";
import { useRouter } from "next/navigation";

export default function DisruptionBanner() {
  const router = useRouter();
  return (
    <div className="bg-blue-600 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-2 px-4 py-3 rounded-md shadow-md mt-5 mx-auto w-full max-w-[380px] md:max-w-[800px]">
    <div className="flex flex-col md:flex-row md:items-center md:gap-2 text-[12px] leading-tight">
        <span className="flex items-center gap-2">
          <IoMegaphone className="w-5 h-5 text-white" />
          <span className="font-semibold">New:</span>
          Weekly Disruption Forecasts tailored for
        </span>
        <span className="text-[12px]">
         your business. Get yours <span className="font-semibold">Free!</span>
        </span>
      </div>
      <button onClick={() => router.push('/subscribe')} className="px-4 py-1 bg-black cursor-pointer text-white text-sm rounded-md font-semibold hover:opacity-90 transition self-start md:self-auto">
        Subscribe
      </button>
    </div>
  );
}
