import React, {
	useEffect,
	useRef,
	useState,
} from "react";

import {
	X,
	ChevronLeft,
	ChevronRight,
	ZoomIn,
	ZoomOut,
	RotateCcw,
} from "lucide-react";

export default function ImagePreviewModal({
	open,
	photos = [],
	activeIndex = 0,
	onClose,
	onPrev,
	onNext,
}) {
	const [scale, setScale] = useState(1);

	const [position, setPosition] =
		useState({
			x: 0,
			y: 0,
		});

	const [dragging, setDragging] =
		useState(false);

	const dragStart = useRef({
		x: 0,
		y: 0,
	});

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				onClose?.();
			}

			if (e.key === "ArrowLeft") {
				onPrev?.();
			}

			if (e.key === "ArrowRight") {
				onNext?.();
			}
		};

		document.addEventListener(
			"keydown",
			handleKeyDown,
		);

		return () => {
			document.removeEventListener(
				"keydown",
				handleKeyDown,
			);
		};
	}, [open]);

	useEffect(() => {
		resetZoom();
	}, [activeIndex]);

	const resetZoom = () => {
		setScale(1);

		setPosition({
			x: 0,
			y: 0,
		});
	};

	const zoomIn = () => {
		setScale((prev) =>
			Math.min(prev + 0.15, 5),
		);
	};

	const zoomOut = () => {
		setScale((prev) =>
			Math.max(prev - 0.15, 1),
		);

		if (scale <= 1.25) {
			resetZoom();
		}
	};

	const handleWheel = (e) => {
		e.preventDefault();

		if (e.deltaY < 0) {
			zoomIn();
		} else {
			zoomOut();
		}
	};

	const handleMouseDown = (e) => {
		if (scale <= 1) return;

		setDragging(true);

		dragStart.current = {
			x: e.clientX - position.x,
			y: e.clientY - position.y,
		};
	};

	const handleMouseMove = (e) => {
		if (!dragging) return;

		setPosition({
			x:
				e.clientX -
				dragStart.current.x,
			y:
				e.clientY -
				dragStart.current.y,
		});
	};

	const handleMouseUp = () => {
		setDragging(false);
	};

	const handleDoubleClick = () => {
	if (scale > 1) {
		resetZoom();
	} else {
		setScale(2);
	}
};

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div
				className="relative w-full h-full flex items-center justify-center overflow-hidden"
				onClick={(e) =>
					e.stopPropagation()
				}
				onWheel={handleWheel}
				onMouseMove={
					handleMouseMove
				}
				onMouseUp={handleMouseUp}
				onMouseLeave={
					handleMouseUp
				}
			>
				{/* CLOSE */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
				>
					<X size={22} />
				</button>

				{/* CONTROLS */}
				<div className="absolute top-4 left-4 z-30 flex gap-2">
					<button
						onClick={zoomIn}
						className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
					>
						<ZoomIn size={20} />
					</button>

					<button
						onClick={zoomOut}
						className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
					>
						<ZoomOut size={20} />
					</button>

					<button
						onClick={resetZoom}
						className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
					>
						<RotateCcw size={20} />
					</button>
				</div>

				{/* PREV */}
				{photos.length > 1 && (
					<button
						onClick={onPrev}
						className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white"
					>
						<ChevronLeft size={28} />
					</button>
				)}

				{/* NEXT */}
				{photos.length > 1 && (
					<button
						onClick={onNext}
						className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white"
					>
						<ChevronRight size={28} />
					</button>
				)}

				{/* IMAGE */}
				<img
					src={photos[activeIndex]}
					alt=""
					draggable={false}
					onDoubleClick={
						handleDoubleClick
					}
					onMouseDown={
						handleMouseDown
					}
					className={`max-w-full max-h-[90vh] object-contain select-none transition-transform duration-100 ${scale >
						1
						? "cursor-grab"
						: "cursor-zoom-in"} ${dragging
							? "!cursor-grabbing"
							: ""}`}
					style={{
						transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
					}}
				/>
			</div>
		</div>
	);
}