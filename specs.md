## Architecture

- API service only container with port mapping to host (port 8199)
- Multiple internal networks, database strictly isolated from API service, only reachable by blocklist service
- Use docker volumes to enable persistent postgresql and log data
- inter-service communication must be performed with container names defined in compose file (use dockers internal DNS)

## Service specifications

### Log service

Simple service to track incoming requests. Counts total number of received requests since application start, store this info persistently

GET "/"

- Track total number of received requests since application start (counter)
- Generate (as a string) "counter, timestamp" (in UTC ISO 8601 format) based on the counter amount
- Append the string a new line to a file in persistent storage
- Return the generared string to client as text/plain

GET "/log"

- Return the contents of the file

### Blocklist service

State management service designed to regulate access based on historical data. Processes incoming data by other services like IP address and path. Information is saved with timestamp to database. Database information is used to determine if the specific IP address should be blocked, block should happen once the threshold of two recorded attempts are in the database

Use postgresql, deploy database in separate container with persistent storage. Only allow database connections from blocklist service. Single table is enough

POST "/blocklist"

- Accepts data in text/plain format following the template: ipaddress,path Example request body: 192.168.1.1,/admin
- Store ipaddress and path in database only fhe therea are fewer than 2 existing records for the given ipaddress
- return true as text/plain if 2 or more records for ipaddress are found, otherwise false

GET "/blocklist"

- Return a list of all blocked ip addresses. Each line should be displayed on a new line in the format ip_address, path, timestamp
- Output must be sorted by IP address in ascending order

GET “/isBlocked?ip=”

- Check the query parameter IP address if the address is banned in database
- Return true or false in plain/text

### API service

Systems gateway. Operates on port 8199.
Use X-Forwarded-For HTTP header as the source of the IP address. If header is missing, fall back to connection's remote address

GET "/"

- Sends a request to the Blocklist Service (/isBlocked?ip=), using the source IP address of the incoming request as the parameter to check whether the IP is currently blocked.
- If IP is blocked, respond to request with HTTP 404
- if not blocked, forward request to log service and show the response
- In any other case or issue, respond with 502 error

GET "/log"

- Forward request to log service, stream response back to client
- In any other case or issue, respond with 502 error

GET "/blocklist"

- Forward request to blocklist service, stream response back to client
- In any other case or issue, respond with 502 error

GET "/clear"

- Send a request to log service to clear all stored information. If success, all data within log service must be purged
- Send a request to blocklist service to clear all stored information. If success, data is dropped from database
- Upon receiving confirmation from services that purge was success, return code 200 with body of 'complete'
- In any other case or issue, respond with 502 error

Any other request (catch-all) sends a POST request to blocklist service (/blocklist) providing the clients IP address and request path

- If response indicates that address is blocked, service must respond with 404 code to client, if not blocked 401
- In any other case or issue, respond with 502 error
