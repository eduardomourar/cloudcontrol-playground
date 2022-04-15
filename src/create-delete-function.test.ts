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

  
};

void main();
