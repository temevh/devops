Build

In this stage, you are create the application build process. If you have used compiled programming languages for development, you must compile the application; if you have used an interpreted language, you must prepare its execution environment. The primary objective of this stage is to generate the data necessary for all subsequent steps. Since there were no restrictions on the choice of programming language, it is your responsibility to decide which specific artifacts must be passed on to the next stage of the pipeline.

Test

For this stage, you prepare simple unit tests for a few functions or methods within your application. The tests are required to verify the application’s functionality and generate a report compatible with GitLab’s interface, which must be returned from the stage as an artifact. You should investigate your testing tool’s capability to generate reports in the required format (typically JUnit XML). Additional information is available at: https://docs.gitlab.com/ci/testing/unit_test_reports/. The final result of this stage is to have the test information displayed directly within the GitLab UI, under the “Tests” tab of your running pipeline (see the images below).

Package

In this stage, you are create a container image for your microservice. Since you already have a compiled application or a prepared environment from previous steps, the Dockerfile used in the first exercise will likely not be suitable. You need to create a new Dockerfile that utilizes the artifacts obtained from the preceding stages to build the container. The output of this stage will be the container itself, returned as an artifact (for example, in .tar file format).

Please note that for building and managing the container, you must use Podman image (in gitlab-ci.yml):

Smoketest

In this stage, you will retrieve the container image generated in the previous step, start it, and verify that the container is operational. You are required to use the same Podman image from the preceding stage to run the container. The objective of the check is to confirm that both the container and the application inside it are functioning correctly. A simple API test using curl is sufficient for this verification.
