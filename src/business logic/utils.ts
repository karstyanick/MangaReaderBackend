

export function validateEnvironmentVariable(variable: string): string {
	if(process.env[variable]){
		return process.env[variable] as string;
	}
	throw new Error(`Enviornment Variable: ${variable} not set` )
}