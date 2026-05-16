import React, {
	useEffect,
	useState,
} from "react";

import {
	X,
	User,
	Mail,
	Phone,
	Save,
} from "lucide-react";

const EditProfileModal = ({
	isOpen,
	onClose,
	submitting,
	initialData,
	handleSubmit,
}) => {
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone_number: "",
	});

	useEffect(() => {
		if (isOpen && initialData) {
			setForm({
				name: initialData.name || "",
				email: initialData.email || "",
				phone_number:
					initialData.phone_number || "",
			});
		}
	}, [isOpen, initialData]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
				{/* HEADER */}
				<div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
					<h3 className="font-bold text-gray-900 flex items-center gap-2">
						<User
							size={18}
							className="text-blue-600"
						/>

						Edit Profile
					</h3>

					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-lg transition"
					>
						<X size={18} />
					</button>
				</div>

				{/* CONTENT */}
				<div className="p-6 space-y-5">
					<Input
						icon={User}
						label="Name"
						value={form.name}
						onChange={(v) =>
							setForm((prev) => ({
								...prev,
								name: v,
							}))
						}
					/>

					<Input
						icon={Mail}
						label="Email"
						type="email"
						value={form.email}
						onChange={(v) =>
							setForm((prev) => ({
								...prev,
								email: v,
							}))
						}
					/>

					<Input
						icon={Phone}
						label="Phone Number"
						value={form.phone_number}
						onChange={(v) =>
							setForm((prev) => ({
								...prev,
								phone_number: v,
							}))
						}
					/>
				</div>

				{/* FOOTER */}
				<div className="p-4 border-t border-gray-100 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition"
					>
						Cancel
					</button>

					<button
						onClick={() =>
							handleSubmit(form)
						}
						disabled={submitting}
						className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition"
					>
						<Save size={15} />

						{submitting
							? "Saving..."
							: "Save Changes"}
					</button>
				</div>
			</div>
		</div>
	);
};

function Input({
	icon: Icon,
	label,
	value,
	onChange,
	type = "text",
}) {
	return (
		<div>
			<label className="block text-sm font-semibold mb-2">
				{label}
			</label>

			<div className="relative">
				<div className="absolute left-3 top-1/2 -translate-y-1/2">
					<Icon
						size={16}
						className="text-gray-400"
					/>
				</div>

				<input
					type={type}
					value={value}
					onChange={(e) =>
						onChange(e.target.value)
					}
					className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>
	);
}

export default EditProfileModal;