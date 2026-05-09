import {
	CheckCircle2,
	X,
	Camera,
	Trash2,
} from "lucide-react";

const ResolveModal = ({
	isOpen,
	onClose,
	resolving,
	resolveNotes,
	setResolveNotes,
	proofPhotos,
	proofPhotoPreviews,
	handlePhotoUpload,
	removeProofPhoto,
	handleSubmit,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
				{/* HEADER */}
				<div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
					<h3 className="font-bold text-gray-900 flex items-center gap-2">
						<CheckCircle2
							size={18}
							className="text-green-600"
						/>
						Resolve Report
					</h3>

					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-lg"
					>
						<X size={18} />
					</button>
				</div>

				{/* CONTENT */}
				<div className="p-6 space-y-5">
					{/* PHOTO */}
					<div>
						<label className="block text-sm font-semibold mb-2">
							Proof Photos
						</label>

						<label className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
							<Camera
								className="text-gray-400 mb-2"
								size={26}
							/>

							<span className="text-sm text-gray-500 text-center">
								Upload proof photos
							</span>

							<span className="text-xs text-gray-400 mt-1">
								Max 5 photos
							</span>

							<input
								type="file"
								multiple
								accept="image/*"
								className="hidden"
								onChange={
									handlePhotoUpload
								}
							/>
						</label>

						{/* PREVIEWS */}
						{proofPhotoPreviews.length >
							0 && (
							<div className="grid grid-cols-3 gap-3 mt-4">
								{proofPhotoPreviews.map(
									(
										photo,
										index,
									) => (
										<div
											key={
												index
											}
											className="relative rounded-xl overflow-hidden border border-gray-200 aspect-square group"
										>
											<img
												src={
													photo
												}
												alt=""
												className="w-full h-full object-cover"
											/>

											<button
												type="button"
												onClick={() =>
													removeProofPhoto(
														index,
													)
												}
												className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
											>
												<Trash2
													size={
														14
													}
												/>
											</button>
										</div>
									),
								)}
							</div>
						)}

						<p className="text-xs text-gray-500 mt-3">
							{proofPhotos.length >
							0
								? `${proofPhotos.length} photo selected`
								: "Upload minimal 1 photo"}
						</p>
					</div>

					{/* NOTES */}
					<div>
						<label className="block text-sm font-semibold mb-2">
							Resolution Notes
						</label>

						<textarea
							value={resolveNotes}
							onChange={(e) =>
								setResolveNotes(
									e.target.value,
								)
							}
							className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Jelaskan bagaimana barang dikembalikan..."
						/>
					</div>
				</div>

				{/* FOOTER */}
				<div className="p-4 border-t border-gray-100 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100"
					>
						Cancel
					</button>

					<button
						onClick={handleSubmit}
						disabled={
							resolving ||
							proofPhotos.length ===
								0
						}
						className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
					>
						{resolving
							? "Processing..."
							: "Confirm"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ResolveModal;