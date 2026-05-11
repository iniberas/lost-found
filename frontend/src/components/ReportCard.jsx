import React from "react";
import {
	MapPin,
	BadgeCheck,
	ChevronRight,
} from "lucide-react";

const ReportCard = ({
	item,
	onClick,
	compact = false,
}) => {
	return (
		<div
			className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col h-full font-poppins cursor-pointer active:scale-[0.99]"
			onClick={onClick}
		>
			{/* IMAGE */}
			<div className="relative bg-gray-200">
				<div
					className={
						compact
							? "h-28 sm:h-32"
							: "h-36 sm:h-44"
					}
				>
					{item.photos &&
					item.photos.length > 0 ? (
						<img
							src={item.photos[0]}
							alt={item.title}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium bg-gray-100">
							No Image
						</div>
					)}
				</div>

				{/* OWNER BADGE */}
				{item.is_owner && (
					<div className="absolute top-2 left-2">
						<div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50/95 backdrop-blur border border-blue-100 shadow-sm">
							<BadgeCheck
								size={11}
								className="text-blue-600"
							/>

							<span className="text-[10px] font-bold text-blue-700 whitespace-nowrap">
								Punya lu
							</span>
						</div>
					</div>
				)}
			</div>

			{/* CONTENT */}
			<div className="p-3 sm:p-4 flex flex-col flex-grow">
				{/* TITLE */}
				<h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1">
					{item.title}
				</h3>

				{/* DESC */}
				<p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
					{item.description}
				</p>

				{/* LOCATION */}
				<div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 mt-3">
					<MapPin size={13} />
					<span className="truncate">
						{item.location_name ||
							"Lokasi tidak disebutkan"}
					</span>
				</div>

				{/* BUTTON */}
				<div className="mt-4">
					<button className="w-full py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#0C0B89] text-xs sm:text-sm font-semibold transition border border-gray-200 flex items-center justify-center gap-1">
						Lihat Detail

						<ChevronRight size={15} />
					</button>
				</div>
			</div>
		</div>
	);
};

export default ReportCard;