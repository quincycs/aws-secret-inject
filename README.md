Inject aws secrets, ssm parameters into config files.  Works with any text file.  Below is an example of a `.env` file, but it works for any text file (eg xml or json).

## Usage

```
aws-secret-inject -i some.env.template -o some.env
```

Example Input File: `some.env.template`
```
someParameter="ssm:/some-service/SomeThing"
someSecretYyy="secure-ssm:/some-service/DbConnectionString"
anotherSecret="secret:/some-service/SomeSecret"
someSecretJso="secret-json:someCredential.{password}"
```

"ssm:" denotes SSM parameter. "/some-service/SomeThing" is the parameter name.

"secure-ssm:" denotes a secure SSM parameter.

"secret:" denotes secrets manager. "/some-service/SomeSecret" is the secret name.

"secret-json:" denotes secrets manager. "someCredential" is the secret name. "password" is the json key that you want the value for.

Output File: `some.env`
```
someParameter="xxxx"
someSecretYyy="yyyy"
anotherSecret="wwww"
someSecretJso="zzzz"
```

Note: quotes are not necessary.

## Thanks

Inspired by `op inject` by 1Password.  Checkout npm `gcloud-secret-inject` too.
