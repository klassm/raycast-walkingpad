import { execSync } from "node:child_process";
import {
	Action,
	ActionPanel,
	Color,
	closeMainWindow,
	Icon,
	List,
	showToast,
} from "@raycast/api";
import fetch from "node-fetch";

interface Command {
	text: string;
	path: string;
}

const commands = [
	{
		text: "Start",
		path: "/treadmill/start",
	},
	{
		text: "Stop",
		path: "/treadmill/stop",
	},
	{
		text: "Faster",
		path: "/treadmill/faster",
	},
	{
		text: "Slower",
		path: "/treadmill/slower",
	},
	{
		text: "1,5 km/h",
		path: "/treadmill/speed/15",
	},
	{
		text: "2,0 km/h",
		path: "/treadmill/speed/20",
	},
	{
		text: "2,5 km/h",
		path: "/treadmill/speed/25",
	},
	{
		text: "3,0 km/h",
		path: "/treadmill/speed/30",
	},
	{
		text: "3,5 km/h",
		path: "/treadmill/speed/35",
	},
	{
		text: "4,0 km/h",
		path: "/treadmill/speed/40",
	},
	{
		text: "4,5 km/h",
		path: "/treadmill/speed/45",
	},
	{
		text: "5 km/h",
		path: "/treadmill/speed/50",
	},
	{
		text: "5,5 km/h",
		path: "/treadmill/speed/55",
	},
	{
		text: "6,0 km/h",
		path: "/treadmill/speed/60",
	},
	{
		text: "6,5 km/h",
		path: "/treadmill/speed/65",
	},
	{
		text: "7,0 km/h",
		path: "/treadmill/speed/70",
	},
	{
		text: "7,5 km/h",
		path: "/treadmill/speed/75",
	},
	{
		text: "8,0 km/h",
		path: "/treadmill/speed/80",
	},
];

async function startAppIfRequired() {
	try {
		execSync(`ps aux | grep -v "grep" | grep "Walkingpad Client"`);
	} catch (_e) {
		execSync(`open -a "Walkingpad Client"`);
		await new Promise((resolve) => setTimeout(resolve, 3000));
	}
}

export default function WalkingPadSpeed() {
	const requestTreadmill = async ({ text, path }: Command) => {
		await startAppIfRequired();
		// noinspection HttpUrlsUsage
		await fetch(`http://[::1]:4934${path}`, { method: "POST" });
		await showToast({
			title: "Success",
			message: `Treadmill was set to ${text}`,
		});
		setTimeout(closeMainWindow, 1000);
	};

	return (
		<List searchBarPlaceholder="WalkingPad Speed" throttle>
			<List.Section title="Results">
				{commands.map((command: Command) => (
					<List.Item
						key={command.path}
						title={command.text}
						icon={{
							source: Icon.ArrowRight,
							tintColor: Color.Orange,
						}}
						actions={
							<ActionPanel>
								<ActionPanel.Section>
									<Action
										title="Set speed"
										onAction={() => requestTreadmill(command)}
									/>
								</ActionPanel.Section>
							</ActionPanel>
						}
					/>
				))}
			</List.Section>
		</List>
	);
}
