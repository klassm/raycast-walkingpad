import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
	Action,
	ActionPanel,
	Color,
	closeMainWindow,
	Icon,
	List,
	showToast,
	Toast,
} from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { Duration } from "luxon";
import { useEffect, useMemo } from "react";

const execFileAsync = promisify(execFile);

const API_BASE = "http://127.0.0.1:4934";
const APP_NAME = "Walkingpad Client";

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function isClientAvailable(): Promise<boolean> {
	try {
		const response = await fetch(`${API_BASE}/treadmill`, {
			method: "GET",
			signal: AbortSignal.timeout(1500),
		});
		return response.ok;
	} catch {
		return false;
	}
}

async function ensureClientAvailable(): Promise<void> {
	if (await isClientAvailable()) {
		return;
	}
	try {
		await execFileAsync("open", ["-a", APP_NAME]);
	} catch {
		throw new Error(
			`Could not start the ${APP_NAME} app. Please install and start it manually.`,
		);
	}
	const timeoutMs = 15000;
	for (let waited = 0; waited < timeoutMs; waited += 500) {
		await sleep(500);
		if (await isClientAvailable()) {
			return;
		}
	}
	throw new Error(
		`The ${APP_NAME} app is not responding. Please check that it is running.`,
	);
}

const NOT_CONNECTED_MESSAGE =
	"WalkingPad is not connected. Connect the treadmill in the WalkingPad client first.";

interface StatusResponse {
	steps: number;
	distance: number;
	walkingSeconds: number;
	speed: number;
	connected?: boolean;
}

async function fetchStatus(): Promise<StatusResponse> {
	const response = await fetch(`${API_BASE}/treadmill`, {
		method: "GET",
		signal: AbortSignal.timeout(5000),
	});
	if (!response.ok) {
		throw new Error(
			`The ${APP_NAME} app returned an error (HTTP ${response.status}).`,
		);
	}
	const data: unknown = await response.json();
	if (!isStatusResponse(data)) {
		throw new Error(
			`The ${APP_NAME} app returned an unexpected status response.`,
		);
	}
	return data;
}

async function sendCommand(path: string): Promise<void> {
	const status = await fetchStatus();
	if (status.connected === false) {
		throw new Error(NOT_CONNECTED_MESSAGE);
	}
	let response: Response;
	try {
		response = await fetch(`${API_BASE}${path}`, {
			method: "POST",
			signal: AbortSignal.timeout(5000),
		});
	} catch (error) {
		throw new Error(
			`Could not reach the ${APP_NAME} app: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
	if (response.status === 428) {
		throw new Error(NOT_CONNECTED_MESSAGE);
	}
	if (!response.ok) {
		throw new Error(
			`The ${APP_NAME} app returned an error (HTTP ${response.status}).`,
		);
	}
}

export default function WalkingPadSpeed() {
	const requestTreadmill = async ({ text, path }: Command) => {
		const toast = await showToast({
			style: Toast.Style.Animated,
			title: "Sending command",
			message: text,
		});
		try {
			await ensureClientAvailable();
			await sendCommand(path);
			toast.style = Toast.Style.Success;
			toast.title = "Success";
			toast.message = `Treadmill was set to ${text}`;
			setTimeout(closeMainWindow, 1000);
		} catch (error) {
			toast.style = Toast.Style.Failure;
			toast.title = "Failed";
			toast.message = error instanceof Error ? error.message : String(error);
		}
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
										title={command.text}
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
	const { isLoading, data, error, revalidate } = useFetch(
		`${API_BASE}/treadmill`,
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
		if (data.connected === false) {
			return "**WalkingPad is not connected.**\n\nConnect the treadmill in the WalkingPad client first.";
		}
		const duration =
			data.walkingSeconds > 3600
				? Duration.fromObject({ seconds: data.walkingSeconds })
						.shiftTo("hours")
						.toFormat("h'h' m'm' s's'")
				: Duration.fromObject({ seconds: data.walkingSeconds })
						.shiftTo("minutes")
						.toFormat("mm'm' ss's'");
		return `
		Steps: ${data.steps} steps
		Distance: ${data.distance} m
		Duration: ${duration}
		Speed: ${data.speed} km/h
		`;
	}, [data]);

	if (error) {
		return (
			<List.Item.Detail
				markdown={`**WalkingPad client is not reachable.**\n\nMake sure the ${APP_NAME} app is running.`}
			/>
		);
	}

	if (!markdown) {
		return (
			<List.Item.Detail
				isLoading={isLoading}
				markdown="Waiting for status ..."
			/>
		);
	}

	return <List.Item.Detail isLoading={isLoading} markdown={markdown} />;
}
