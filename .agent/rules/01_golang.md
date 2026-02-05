---
trigger: always_on
---

# Go Best Practices for K8s Cronjobs

This is a concise guide for writing robust, maintainable Go applications intended to run as non-interactive jobs, such as Kubernetes CronJobs.

-----

## Guidelines

### Interfaces, Slices, and Maps

  - **Interfaces**: Pass interfaces by value, not by pointer.
    ```go
    func DoSomething(r io.Reader) // Good
    ```
  - **Interface Compliance**: Statically verify that a type implements an interface.
    ```go
    var _ io.Reader = (*MyReader)(nil)
    ```
  - **Copy at Boundaries**: Slices and maps are reference types. Copy them at API boundaries to prevent external mutation of internal state.
    ```go
    func (c *Config) SetValues(v []string) {
      c.values = make([]string, len(v))
      copy(c.values, v)
    }
    ```

-----

## Error Handling & Reliability

  - **Don't Panic**: Never use `panic` for handleable errors. A panic will crash the container. Return errors instead.

  - **Error Wrapping**: Always add context to errors when returning them up the call stack. This is crucial for debugging from logs. Use the `%w` verb.

    ```go
    if err != nil {
      return fmt.Errorf("failed to process user %d: %w", userID, err)
    }
    ```

  - **Error Types**: Use exported variables for sentinel errors (`var ErrNotFound = errors.New(...)`) so callers can check them with `errors.Is`. For errors with dynamic context, use custom types.

  - **Handle Errors Once**: A function should either handle an error (e.g., retry) or return it. **Do not log and return an error**, as this creates duplicate log entries. The top-level caller should be responsible for logging.

    ```go
    // Bad: logs and returns
    if err != nil {
      log.Printf("ERROR: could not connect: %v", err)
      return err
    }
    ```

-----

## Application Structure

  - **Avoid `init()`**: Avoid using `init()` functions. They make code hard to test, hide dependencies, and complicate configuration management, which is vital in a Kubernetes environment. Perform setup in your `main` or `run` function.

  - **Exit Only in `main`**: A Go program should only exit from the `main` function. All other packages and functions should return errors to their callers. This makes code reusable and testable. Structure your application with a `run()` function that returns an error to `main`.

    ```go
    func main() {
      // Setup context, flags, config...
      if err := run(context.Background()); err != nil {
        log.Fatalf("Job failed: %v", err) // Or os.Exit(1)
      }
    }

    func run(ctx context.Context) error {
      // Main application logic here.
      f, err := os.Open("my-file")
      if err != nil {
        return err // Return error, don't exit.
      }
      defer f.Close()
      // ...
      return nil
    }
    ```

  - **Avoid Mutable Globals**: Do not rely on mutable global variables. Pass dependencies (like configuration or database clients) explicitly. This is known as dependency injection and makes your application predictable.

-----

## Concurrency & Resources

  - **Use `defer` for Cleanup**: Always use `defer` to close files, release locks, or clean up other resources. This guarantees execution even if errors occur.
  - **Goroutine Lifecycle**: Any goroutine you start must have a clear exit strategy. Don't let them leak. For a job that should finish, use a `sync.WaitGroup` to wait for all background tasks to complete before `run()` returns.
    ```go
    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
      defer wg.Done()
      // do background work
    }()
    // ... do main work
    wg.Wait() // Wait for background work to finish
    ```

-----

## Data & Style

  - **Use Struct Field Tags**: For any struct that will be serialized (e.g., for structured logging with JSON), always use field tags.

    ```go
    type LogEntry struct {
      Message string `json:"message"`
      UserID  int    `json:"userId"`
    }
    ```

  - **Pre-allocate Capacity**: When creating a slice or map where the size is known, pre-allocate the capacity. This significantly reduces memory allocations and improves performance.

    ```go
    items := make([]Item, 0, len(sourceItems))
    lookup := make(map[string]int, len(keys))
    ```

  - **`nil` is a valid slice**: A `nil` slice is functionally equivalent to an empty slice. Check for emptiness with `len(s) == 0`, not `s == nil`.

  - **Reduce Nesting**: Use guard clauses to handle errors at the beginning of a function. This makes the main logic path flatter and easier to read.

    ```go
    // Good: return early
    if err != nil {
      return err
    }
    // normal logic...
    ```

  - **Use Linters**: Use tools like `go vet` and `staticcheck` in your CI/CD pipeline to catch common bugs and style issues automatically.
