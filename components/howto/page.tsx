import {
	BellRing,
	CalendarRange,
	CheckCircle2,
	FileSpreadsheet,
	LayoutDashboard,
	ShieldCheck,
	Users,
} from "lucide-react";

const setupSteps = [
	{
		title: "Add your vendors",
		description:
			"Start in Workspace and create each vendor with contract end date, notice period, and monthly cost.",
		detail: "If your team already has a spreadsheet, import the list by CSV to avoid manual entry.",
		icon: FileSpreadsheet,
	},
	{
		title: "Review the renewal timeline",
		description:
			"Use the list, calendar, and spend views to see what expires first and how much budget is exposed.",
		detail: "High-risk contracts are the ones approaching renewal inside the alert window.",
		icon: CalendarRange,
	},
	{
		title: "Act before the deadline",
		description:
			"Check contracts inside the 90, 60, or 30 day window, then update terms or plan negotiations with the owner.",
		detail: "The goal is to make renewals visible early enough that they stop becoming last-minute work.",
		icon: BellRing,
	},
];

const workspaceSections = [
	{
		name: "Home",
		description:
			"This page gives the operating model for the workspace: what to set up first, where to look daily, and how to keep the renewal queue healthy.",
		icon: LayoutDashboard,
	},
	{
		name: "Workspace",
		description:
			"This is the live contract area. Add vendors, switch views, import CSV data, and maintain the contract list used by the team.",
		icon: Users,
	},
];

const checklist = [
	"Track the contract end date for every paid vendor.",
	"Set a notice period that matches the negotiation or cancellation window.",
	"Record monthly cost so the spend view reflects budget impact.",
	"Review critical renewals every week and assign a clear owner.",
	"Import old spreadsheet data instead of rebuilding the list manually.",
];

const guardrails = [
	"Do not wait until 30 days to review expensive contracts.",
	"Keep dates and notice periods accurate after every amendment.",
	"Use the spend view to spot high-cost renewals before budget reviews.",
];

export default function HowToPage() {
	return (
		<div className="h-full overflow-y-auto bg-[#1a1a1a] text-white">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 lg:px-6">
				<section className="overflow-hidden rounded-[28px] border border-[#2b2b2b] bg-[#202020]">
					<div className="grid gap-0 lg:grid-cols-[minmax(0,1.45fr)_320px]">
						<div className="border-b border-[#2b2b2b] px-6 py-6 lg:border-b-0 lg:border-r">
							<p className="text-[11px] uppercase tracking-[0.24em] text-[#8a8a8a]">How to use Aeitor</p>
							<h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
								Keep every renewal visible before it becomes urgent.
							</h1>
							<p className="mt-4 max-w-2xl text-sm leading-7 text-[#a9a9b2] md:text-[15px]">
								Aeitor is built to replace scattered spreadsheets with one contract workspace. The
								routine is simple: load vendors, watch the renewal windows, and act early on the
								contracts that matter most.
							</p>

							<div className="mt-6 grid gap-3 md:grid-cols-3">
								<div className="rounded-2xl border border-[#313131] bg-[#181818] p-4">
									<p className="text-xs uppercase tracking-[0.18em] text-[#7d7d86]">Primary job</p>
									<p className="mt-2 text-lg font-medium text-white">Renewal visibility</p>
									<p className="mt-2 text-sm leading-6 text-[#9d9da7]">
										Surface dates, owners, and spend before the deadline gets close.
									</p>
								</div>
								<div className="rounded-2xl border border-[#313131] bg-[#181818] p-4">
									<p className="text-xs uppercase tracking-[0.18em] text-[#7d7d86]">Best cadence</p>
									<p className="mt-2 text-lg font-medium text-white">Weekly review</p>
									<p className="mt-2 text-sm leading-6 text-[#9d9da7]">
										Check new critical contracts and confirm who owns the next action.
									</p>
								</div>
								<div className="rounded-2xl border border-[#313131] bg-[#181818] p-4">
									<p className="text-xs uppercase tracking-[0.18em] text-[#7d7d86]">Alert windows</p>
									<p className="mt-2 text-lg font-medium text-white">90 / 60 / 30 days</p>
									<p className="mt-2 text-sm leading-6 text-[#9d9da7]">
										Use these windows to negotiate, approve, or cancel on time.
									</p>
								</div>
							</div>
						</div>

						<aside className="px-6 py-6">
							<div className="rounded-2xl border border-[#2d3d2f] bg-[#162117] p-5">
								<div className="flex items-start gap-3">
									<ShieldCheck className="mt-0.5 h-5 w-5 text-[#98d39d]" />
									<div>
										<p className="text-sm font-medium text-white">What good usage looks like</p>
										<p className="mt-2 text-sm leading-6 text-[#b8cdb9]">
											Every contract has a date, a notice period, a cost, and someone who is already
											aware of the next decision before the final month starts.
										</p>
									</div>
								</div>
							</div>

							<div className="mt-4 rounded-2xl border border-[#313131] bg-[#181818] p-5">
								<p className="text-xs uppercase tracking-[0.18em] text-[#7d7d86]">Daily quick check</p>
								<ul className="mt-4 space-y-3 text-sm text-[#cfcfd5]">
									{guardrails.map((item) => (
										<li key={item} className="flex items-start gap-3 leading-6">
											<span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#d5d0c6]" />
											<span>{item}</span>
										</li>
									))}
								</ul>
							</div>
						</aside>
					</div>
				</section>

				<section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.95fr)]">
					<div className="rounded-[28px] border border-[#2b2b2b] bg-[#202020] p-6">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-[11px] uppercase tracking-[0.22em] text-[#8a8a8a]">Getting started</p>
								<h2 className="mt-2 text-2xl font-semibold text-white">Three-step setup</h2>
							</div>
							<span className="rounded-full border border-[#343434] bg-[#191919] px-3 py-1 text-xs text-[#b3b3ba]">
								5 to 10 minutes
							</span>
						</div>

						<div className="mt-6 space-y-4">
							{setupSteps.map((step, index) => {
								const Icon = step.icon;
								return (
									<article
										key={step.title}
										className="grid gap-4 rounded-2xl border border-[#303030] bg-[#181818] p-4 md:grid-cols-[56px_minmax(0,1fr)]"
									>
										<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#343434] bg-[#202020] text-[#ece7dc]">
											<Icon className="h-6 w-6" />
										</div>
										<div>
											<p className="text-xs uppercase tracking-[0.18em] text-[#7d7d86]">Step {index + 1}</p>
											<h3 className="mt-1 text-lg font-medium text-white">{step.title}</h3>
											<p className="mt-2 text-sm leading-6 text-[#c6c6cd]">{step.description}</p>
											<p className="mt-2 text-sm leading-6 text-[#8f8f98]">{step.detail}</p>
										</div>
									</article>
								);
							})}
						</div>
					</div>

					<div className="rounded-[28px] border border-[#2b2b2b] bg-[#202020] p-6">
						<p className="text-[11px] uppercase tracking-[0.22em] text-[#8a8a8a]">Checklist</p>
						<h2 className="mt-2 text-2xl font-semibold text-white">What to enter first</h2>
						<div className="mt-6 space-y-3">
							{checklist.map((item) => (
								<div key={item} className="flex items-start gap-3 rounded-2xl border border-[#303030] bg-[#181818] p-4">
									<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#98d39d]" />
									<p className="text-sm leading-6 text-[#cdced4]">{item}</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="grid gap-5 lg:grid-cols-2">
					{workspaceSections.map((section) => {
						const Icon = section.icon;
						return (
							<article key={section.name} className="rounded-[28px] border border-[#2b2b2b] bg-[#202020] p-6">
								<div className="flex items-start gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#343434] bg-[#181818] text-[#ece7dc]">
										<Icon className="h-5 w-5" />
									</div>
									<div>
										<p className="text-[11px] uppercase tracking-[0.22em] text-[#8a8a8a]">Navigation</p>
										<h2 className="mt-2 text-xl font-semibold text-white">{section.name}</h2>
										<p className="mt-3 max-w-xl text-sm leading-7 text-[#b2b2bb]">{section.description}</p>
									</div>
								</div>
							</article>
						);
					})}
				</section>
			</div>
		</div>
	);
}
