import { Request } from "../deps.ts";
import { generateScript } from "../src/generate_client.ts";
import { getOrigin, minifyJS } from "../src/helpers.ts";
import { getProjectConfiguration, ObjectId, Project } from "../src/db.ts";

export async function getClient(projectId: string, req: Request) {
    const origin = getOrigin(req);
    const pageLoadId = new ObjectId().toString();

    console.log(`debug: Client request for Project ${projectId} from Origin ${origin}.`);

    const project = await getProjectConfiguration(projectId, origin) as Project;
    const body = generateScript(project, pageLoadId);

    if (project && body) {
        return minifyJS(body);
    } else {
        return undefined;
    }
}
