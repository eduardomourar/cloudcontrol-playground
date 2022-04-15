import {
  createResource,
  deleteResource,
  readResource,
  updateResource,
} from "./index";

const main = async () => {
  const baseResourceName = "test-202204151200-deleteme";
  console.time("R1|Create IAM Role|");
  const iamRole = await createResource({
    TypeName: "AWS::IAM::Role",
    DesiredState: JSON.stringify({
      RoleName: baseResourceName,
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: ["lambda.amazonaws.com"],
            },
            Action: ["sts:AssumeRole"],
          },
        ],
      },
    }),
  });
  console.timeEnd("R1|Create IAM Role|");

  console.time("R2|Update IAM Role|");
  const updatedIamRole = await updateResource({
    TypeName: iamRole?.TypeName,
    Identifier: iamRole?.Identifier,
    PatchDocument: JSON.stringify([
      {
        op: "add",
        path: "/ManagedPolicyArns",
        value: [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        ],
      },
    ]),
  });
  console.timeEnd("R2|Update IAM Role|");

  const readResponse = await readResource({
    Identifier: updatedIamRole?.Identifier,
    TypeName: "AWS::IAM::Role",
  });
  const iamRoleDetails = JSON.parse(readResponse?.Properties || "{}");

  console.time("G1|Create Log Group|");
  const logGroup = await createResource({
    TypeName: "AWS::Logs::LogGroup",
    DesiredState: JSON.stringify({
      LogGroupName: `/aws/lambda/${baseResourceName}`,
      RetentionInDays: 3,
    }),
  });
  console.timeEnd("G1|Create Log Group|");
  console.log(logGroup);

  console.time("G2|Update Log Group|");
  await updateResource({
    TypeName: logGroup?.TypeName,
    Identifier: logGroup?.Identifier,
    PatchDocument: JSON.stringify([
      {
        op: "replace",
        path: "/RetentionInDays",
        value: 1,
      },
    ]),
  });
  console.timeEnd("G2|Update Log Group|");

  const functionDesiredState = {
    FunctionName: baseResourceName,
    Runtime: "nodejs14.x",
    Handler: "index.handler",
    Timeout: 3,
    MemorySize: 1024,
    Code: { ZipFile: "return true;" },
    Environment: {
      Variables: {
        "VARIABLE_NAME": "some-value"
      },
    },
    Role: iamRoleDetails.Arn,
  };

  console.time("F1|Create Lambda Function|");
  const lambdaFunction = await createResource({
    TypeName: "AWS::Lambda::Function",
    DesiredState: JSON.stringify(functionDesiredState),
  });
  console.timeEnd("F1|Create Lambda Function|");
  console.log(lambdaFunction);

  console.time("F2|Update Code of Lambda Function|");
  await updateResource({
    TypeName: lambdaFunction?.TypeName,
    Identifier: lambdaFunction?.Identifier,
    PatchDocument: JSON.stringify([
      {
        op: "add",
        path: "/Code",
        value: {
          ZipFile:
            "exports.handler = async (event, context) => {return event;}",
        },
      },
    ]),
  });
  console.timeEnd("F2|Update Code of Lambda Function|");

  console.time("F3|Update Configuration of Lambda Function|");
  await updateResource({
    TypeName: lambdaFunction?.TypeName,
    Identifier: lambdaFunction?.Identifier,
    PatchDocument: JSON.stringify([
      {
        op: "add",
        path: "/Role",
        value: iamRoleDetails.Arn,
      },
      {
        op: "add",
        path: "/Environment",
        value: {
          Variables: {
            "VARIABLE_NAME": "another-value"
          },
        },
      },
      {
        // This is needed because of issue with WriteOnlyProperties
        op: "add",
        path: "/Code",
        value: {
          ZipFile:
            "exports.handler = async (event, context) => {return event;}",
        },
      },
    ]),
  });
  console.timeEnd("F3|Update Configuration of Lambda Function|");

  console.time("F4|Update to Original Input of Lambda Function|");
  await updateResource({
    TypeName: lambdaFunction?.TypeName,
    Identifier: lambdaFunction?.Identifier,
    PatchDocument: JSON.stringify([
      {
        op: "add",
        path: "/FunctionName",
        value: functionDesiredState.FunctionName,
      },
      {
        op: "add",
        path: "/Runtime",
        value: functionDesiredState.Runtime,
      },
      {
        op: "add",
        path: "/Handler",
        value: functionDesiredState.Handler,
      },
      {
        op: "add",
        path: "/Timeout",
        value: functionDesiredState.Timeout,
      },
      {
        op: "add",
        path: "/MemorySize",
        value: functionDesiredState.MemorySize,
      },
      {
        op: "add",
        path: "/Code",
        value: {
          ZipFile: functionDesiredState.Code.ZipFile,
        },
      },
      {
        op: "add",
        path: "/Environment",
        value: {
          Variables: functionDesiredState.Environment.Variables,
        },
      },
      {
        op: "add",
        path: "/Role",
        value: functionDesiredState.Role,
      },
    ]),
  });
  console.timeEnd("F4|Update to Original Input of Lambda Function|");

  console.time("F5|Delete Lambda Function|");
  await deleteResource({
    TypeName: "AWS::Lambda::Function",
    Identifier: baseResourceName,
  }).catch(console.log);
  console.timeEnd("F5|Delete Lambda Function|");

  console.time("G3|Delete Log Group|");
  await deleteResource({
    TypeName: "AWS::Logs::LogGroup",
    Identifier: `/aws/lambda/${baseResourceName}`,
  }).catch(console.log);
  console.timeEnd("G3|Delete Log Group|");

  console.time("R3|Delete IAM Role|");
  await deleteResource({
    TypeName: "AWS::IAM::Role",
    Identifier: baseResourceName,
  }).catch(console.log);
  console.timeEnd("R3|Delete IAM Role|");
};

void main();
