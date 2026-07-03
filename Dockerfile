FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR src

COPY [serverserverserver.csproj, serverserver]
RUN dotnet restore serverserverserver.csproj

COPY server .

WORKDIR srcserver

RUN dotnet build server.csproj -c Release -o appbuild

FROM build AS publish
RUN dotnet publish server.csproj -c Release -o apppublish pUseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR app
COPY --from=publish apppublish .

ENV ASPNETCORE_URLS=http+7860
EXPOSE 7860

ENTRYPOINT [dotnet, server.dll]