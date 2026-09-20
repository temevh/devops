Detailed Service Specifications
Log Service

The Log Service is a simple service designed to track incoming requests. It counts the total number of requests received since the application started and persistently stores this information in a file located on persistent storage.

The service provides the following REST API endpoints:

GET “/”
Tracks the total number of requests received by this endpoint since the application started (counter).

Generates a string based on the following template: “counter, timestamp”, The timestamp must be in UTC and follow the ISO 8601 format. For example, the response string should look like: 10,2025-09-01T09:00:00Z

Appends this string as a new line to a file in persistent storage

Returns the generated string to the client as a text/plain response

GET /”log”
Returns the content of the file from persistent storage as a text/plain response.

Blocklist service

The Blocklist Service is a specialized state-management service designed to regulate access based on historical data. The service processes incoming data provided by other services (IP address and path), saves this information along with a timestamp into a database, and based on the accumulated data, determines the blocking status of a specific IP address. An IP address is considered ‘blocked’ once it reaches a threshold of two recorded attempts in the database.

This service requires a PostgreSQL database to function. For this exercise, the database should be deployed in a separate container with persistent storage configured for its data. Network access to the database must be strictly restricted: it should only allow connections from the Blocklist service, ensuring that no other services can reach the database at the network level.

The student is responsible for defining the database schema, and a single table is considered sufficient for this implementation.

The service provides the following REST API endpoints:

POST “/blocklist”
Accepts data in text/plain format following the template: ipaddress,path Example request body: 192.168.1.1,/admin

Stores the ipaddress and path in the database only if there are fewer than 2 existing records for this ipaddress.

Returns true as text/plain if the database contains 2 or more records for this ipaddress after processing the request; otherwise, returns false as text/plain.

GET “/blocklist”
Returns a list of all blocked IP addresses (those that have 2 or more records in the database) as text/plain. Each record should be displayed on a new line following the template: ip_address, path, timestamp. The output must be sorted by IP address in ascending order. Example: 192.168.1.1,/admin,2023-10-24T10:00:00Z 192.168.1.1,/login,2023-10-24T10:05:00Z 192.168.1.3,/api,2023-10-24T11:00:00Z 192.168.1.3,/config,2023-10-24T11:01:00Z

GET “/isBlocked?ip=”
Accepts the IP address as a query parameter in the URL. Example request: /isBlocked?ip=192.168.1.1

Checks the database for the given IP address.

Returns true as text/plain if the database contains 2 or more records for this IP address; otherwise, returns false as text/plain

API Service

The API Service acts as the system’s Gateway, serving as the sole entry point for all client interactions. It is the only component exposed to the public network; the service is required to operate on port 8199. The service manages all incoming traffic by either transparently forwarding requests to internal components or executing multi-step orchestration logic based on the specific requirements of each endpoint. In some scenarios, the service operates as a proxy, simply retrieving data from an internal service and passing it back to the client without modification. In others, it functions as an orchestrator: it evaluates the context of a request, interacts with the Blocklist Service to enforce security policies. From a structural perspective, the API Service defines the boundary of the application’s private network. While it can communicate with all internal services, it ensures that the Log Service, Blocklist Service, and the PostgreSQL database remain completely unreachable from the outside world.

To ensure the correct operation of filtering systems (Blocklist), the API Service must accurately identify the client’s real IP address.

Since modern applications are typically deployed behind proxy servers or load balancers, the “X-Forwarded-For” HTTP header must be used as the source IP address in this exercise. If the header contains multiple addresses, the first one must be used. If the header is missing, fall back to the connection’s remote address.

To test blocking logic, you should manually simulate different client IPs by passing the header via curl. Example:

curl -H "X-Forwarded-For: 1.1.1.1" http://localhost:8199
The service provides the following REST API endpoints:

GET “/”
Sends a request to the Blocklist Service (/isBlocked?ip=), using the source IP address of the incoming request as the parameter to check whether the IP is currently blocked.

If the response indicates that the IP in blocklist (true), it responds to the incoming request with an HTTP 404 status code.

If the address is not in the blocklist (false), it forwards the request to the Log Service (/) and streams the response back to the client.

In the event of any issues during the request to either the Blocklist Service or the Log Service (e.g., connection timeout, internal server error or an unexpected response), the system must respond to the client with an HTTP 502 status code.

GET “/log”
Forwards the request to the Log Service (/log) and streams the response back to the client.

In the event of any issues during the request to the Log Service (e.g., connection timeout or internal server error from upstream services), the system must respond to the client with an HTTP 502 status code.

GET “/blocklist”
Forwards the request to the Blocklist Service (/blocklist) and streams the response back to the client.

In the event of any issues during the request to the Blocklist Service (e.g., connection timeout or internal server error from upstream services), the system must respond to the client with an HTTP 502 status code.

GET “/clear”
Sends a request to the Log Service to clear all stored information. Upon successful completion of the request, all data within the Log Service must be fully purged. The student is responsible for independently designing and implementing the corresponding endpoint on the Log Service side.

Sends a request to the Blocklist Service to clear all stored information. Upon successful completion of the request, all IP addresses and their associated data within the database must be fully purged. The student is responsible for independently designing and implementing the corresponding endpoint on the Blocklist Service side.

Upon receiving confirmation from the internal services that the purge was successful, the system must respond to the client with an HTTP 200 status code with a text/plain body containing the text ‘complete’.

In the event of any issues during the request to either the Blocklist Service or the Log Service (e.g., connection timeout, internal server error or an unexpected response), the system must respond to the client with an HTTP 502 status code.

Any Other Requests (Catch-all). For any other incoming requests to any paths or using any HTTP methods (GET, POST, PUT, DELETE, etc.) that are not explicitly defined above.
Sends a POST request to the Blocklist Service (/blocklist), providing the client’s IP address and the requested path in the format specified in the Blocklist Service section.

If the response indicates that the address is blocked (true), the service must respond to the client with an HTTP 404 status code.

If the response indicates that the address is not blocked (false), the service must respond to the client with an HTTP 401 status code.

In the event of any issues during the request to the Blocklist Service (e.g., connection timeout, internal server error or an unexpected response), the system must respond to the client with an HTTP 502 status code.
