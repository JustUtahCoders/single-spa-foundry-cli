import FullEnvironment from "yeoman-environment";
import {info, log, secondary} from "../cli-logger";

const env = new FullEnvironment();
export const runSingleSpaGenerator = (args: CreateSingleSpaArgument)=>{
    import("generator-single-spa").then(m=>{
        let arg = ' ';
        arg+= `--dir ${args.dir} `;
        arg+= `--framework ${args.framework} `;
        arg+= `--orgName ${args.orgName} `;
        arg+= `--projectName ${args.projectName} `;
        arg+= `--moduleType ${args.moduleType} `;
        arg+= `--packageManager ${args.packageManager} `;

        if(args.framework=="react"){
            arg+= `--typescript ${args.typescript} `;
        }

        log(secondary.inverse("RUNNING") + secondary(` create-single-spa ${arg}`))
        // @ts-ignore
        env.registerStub(m.default,"generator-single-spa");
        // @ts-ignore
        env.run(`generator-single-spa ${arg} --skipInstall`,"");
    });
}

export interface CreateSingleSpaArgument {
    dir: string,
    orgName: string,
    projectName: string,
    typescript: boolean,
    framework: "none" | "react" | "vue" | "angular" | "svelte",
    moduleType: "app-parcel" | "util-module" | "root-config",
    packageManager: "yarn" | "npm" | "pnpm"
}

export function determineFramework(frameworkArg: string): "none" | "react" | "vue" | "angular" | "svelte"{
    if(!frameworkArg){
        return "react";
    }
    switch (frameworkArg.toLowerCase()){
        case "none":
            return "none";
        case "ng":
        case "angular":
        case "ang":
            return "angular";
        case "vue":
        case "v":
            return "vue";
        case "svelte":
            return "svelte";
        case "react":
        case "reactjs":
        default:
            return "react";
    }
}
export function determinePackageManager(packageManager: string): "yarn" | "npm" | "pnpm"{
    if(!packageManager){
        return "npm";
    }
    switch (packageManager.toLowerCase()){
        case "yarn":
            return "yarn";
        case "pnpm":
            return "yarn";
        default:
            return "npm";
    }
}
