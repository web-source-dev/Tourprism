import { IoMegaphone } from "react-icons/io5";
import Link from "next/link";

export default function DisruptionBanner() {
  return (
    <div className="bg-blue-600 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-2 px-4 py-3 shadow-md w-full">
      <div className="flex flex-col md:flex-row md:items-center md:gap-2 text-[12px] leading-tight">
        <span className="flex items-center gap-2 text-[13px] font-400">
          <IoMegaphone className="w-5 h-5 text-white" />
          <span className="font-400 text-[13px]">New:</span>
          Weekly Disruption Forecasts tailored for
        </span>
        <span className="text-[13px] font-400">
         your business. Get yours <span className="font-semibold">Free!</span>{" "}
          <Link href="/subscribe" className="underline text-white font-semibold hover:text-gray-100">
            Subscribe
          </Link>
        </span>
      </div>
    </div>
  );
}
