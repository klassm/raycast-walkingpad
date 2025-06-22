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
import { useFetch } from "@raycast/utils";
import fetch from "node-fetch";
import { useEffect, useMemo } from "react";

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
		<List searchBarPlaceholder="WalkingPad Speed" throttle isShowingDetail>
			<List.Section title="Results">
				{commands.map((command: Command) => (
					<List.Item
						key={command.path}
						title={command.text}
						icon={{
							source: Icon.ArrowRight,
							tintColor: Color.Orange,
						}}
						detail={<WalkingPadStatus />}
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

interface StatusResponse {
	steps: number;
	distance: number;
	walkingSeconds: number;
	speed: number;
}

function isStatusResponse(value: unknown): value is StatusResponse {
	// biome-ignore lint: we need an any here
	const asAny = value as any;
	if (typeof asAny !== "object") {
		return false;
	}
	const { steps, distance, walkingSeconds, speed } = asAny;
	return [steps, distance, walkingSeconds, speed].every(
		(entry) => entry !== undefined && typeof entry === "number",
	);
}

function WalkingPadStatus() {
	const { isLoading, data, revalidate } = useFetch(
		"http://[::1]:4934/treadmill",
		{ method: "GET" },
	);
	useEffect(() => {
		const interval = setInterval(() => {
			revalidate();
		}, 1000);
		return () => clearInterval(interval);
	}, [revalidate]);
	const markdown = useMemo(() => {
		if (!data || !isStatusResponse(data)) {
			return null;
		}
		return `
		Steps: ${data.steps} steps
		Distance: ${data.distance} m
		Seconds: ${data.walkingSeconds} seconds
		Seconds: ${data.speed} km/h
		`;
	}, [data]);

	if (!markdown) {
		return null;
	}

	return <List.Item.Detail isLoading={isLoading} markdown={markdown} />;
}
