import React, { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";

export function CopyButton({ value }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value ?? "");
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// fallback for older browsers
			const el = document.createElement("textarea");
			el.value = value ?? "";
			document.body.appendChild(el);
			el.select();
			document.execCommand("copy");
			document.body.removeChild(el);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<button
			onClick={handleCopy}
			className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 shrink-0"
			title={copied ? "Copied!" : "Copy"}
		>
			{copied ? (
				<Check size={13} className="text-green-500" />
			) : (
				<Copy size={13} />
			)}
		</button>
	);
}

export default function ViewDetailModal({
	open,
	onClose,
	title = "Detail",
	icon: Icon,
	iconClassName = "",
	children,
}) {
	useEffect(() => {
		if (!open) return;
		const handleEscape = (e) => {
			if (e.key === "Escape") onClose?.();
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
			{/* MODAL */}
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
				{/* HEADER */}
				<div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
					<h3 className="font-bold text-gray-900 flex items-center gap-2">
						{Icon && <Icon size={18} className={iconClassName} />}
						{title}
					</h3>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				{/* CONTENT */}
				<div className="p-6">{children}</div>

				{/* FOOTER */}
				<div className="p-4 border-t border-gray-100 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}