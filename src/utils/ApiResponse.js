class ApiResponse {
  constructor(statusCoded, message = "Success", data) {
    (this.statusCoded = statusCoded),
      (this.data = data),
      (this.success = statusCode < 400);
  }
}

export default ApiResponse;
