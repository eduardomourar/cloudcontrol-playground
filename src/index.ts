import {
  CloudControlClient,
  CreateResourceCommand,
  CreateResourceCommandInput,
  DeleteResourceCommand,
  DeleteResourceCommandInput,
  GetResourceCommand,
  GetResourceCommandInput,
  GetResourceRequestStatusCommand,
  ProgressEvent,
  UpdateResourceCommand,
  UpdateResourceCommandInput,
  waitForResourceRequestSuccess,
} from "@aws-sdk/client-cloudcontrol";

const waitForCloudControlSuccess = async (
  client: CloudControlClient,
  progressEvent?: ProgressEvent
) => {
  if (!progressEvent) {
    throw new Error("Unable to find the progress event");
  }

  if (progressEvent.OperationStatus !== "IN_PROGRESS") {
    return progressEvent;
  }

  await waitForResourceRequestSuccess(
    {
      maxWaitTime: 120,
      client,
    },
    {
      RequestToken: progressEvent.RequestToken,
    }
  );

  const readCommand = new GetResourceRequestStatusCommand({
    RequestToken: progressEvent.RequestToken,
  });
  const response = await client.send(readCommand);

  return response.ProgressEvent;
};

export const createResource = async (input: CreateResourceCommandInput) => {
  const client = new CloudControlClient({ region: "us-east-1" });
  const command = new CreateResourceCommand(input);
  const response = await client.send(command);
  return await waitForCloudControlSuccess(client, response.ProgressEvent);
};

export const readResource = async (input: GetResourceCommandInput) => {
  const client = new CloudControlClient({ region: "us-east-1" });
  const command = new GetResourceCommand(input);
  const response = await client.send(command);
  return response.ResourceDescription;
};

export const updateResource = async (input: UpdateResourceCommandInput) => {
  const client = new CloudControlClient({ region: "us-east-1" });
  const command = new UpdateResourceCommand(input);
  const response = await client.send(command);
  return await waitForCloudControlSuccess(client, response.ProgressEvent);
};

export const deleteResource = async (input: DeleteResourceCommandInput) => {
  const client = new CloudControlClient({ region: "us-east-1" });
  const command = new DeleteResourceCommand(input);
  const response = await client.send(command);
  return await waitForCloudControlSuccess(client, response.ProgressEvent);
};
