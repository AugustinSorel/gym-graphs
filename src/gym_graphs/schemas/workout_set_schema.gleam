import formal/form
import gleam/list
import gleam/option

pub type CreateSet {
  CreateSet(weight: Float, repetitions: Int)
}

pub type CreateSetRow {
  CreateSetRow(
    weight: String,
    repetitions: String,
    weight_error: option.Option(String),
    repetitions_error: option.Option(String),
  )
}

pub type CreateSetsForm {
  CreateSetsForm(rows: List(CreateSetRow), error: option.Option(String))
}

pub type ValidatedCreateSets {
  ValidatedCreateSets(sets: List(CreateSet), form: CreateSetsForm)
}

pub fn prefilled(weight: String, repetitions: String) -> CreateSetsForm {
  CreateSetsForm(rows: [row(weight, repetitions)], error: option.None)
}

pub fn row(weight: String, repetitions: String) -> CreateSetRow {
  CreateSetRow(
    weight:,
    repetitions:,
    weight_error: option.None,
    repetitions_error: option.None,
  )
}

pub fn with_error(form: CreateSetsForm, error: String) -> CreateSetsForm {
  CreateSetsForm(..form, error: option.Some(error))
}

pub fn validate(
  values: List(#(String, String)),
) -> Result(ValidatedCreateSets, CreateSetsForm) {
  let weights = list.key_filter(values, "weight")
  let repetitions = list.key_filter(values, "repetitions")
  let rows = submitted_rows(weights, repetitions)
  let row_count = list.length(rows)

  case
    row_count > 0
    && row_count <= 20
    && list.length(weights) == list.length(repetitions)
  {
    False ->
      Error(CreateSetsForm(
        rows:,
        error: option.Some("Add between 1 and 20 complete sets."),
      ))
    True -> validate_rows(rows)
  }
}

fn submitted_rows(
  weights: List(String),
  repetitions: List(String),
) -> List(CreateSetRow) {
  case weights, repetitions {
    [], [] -> []
    [weight, ..weights], [] -> [row(weight, ""), ..submitted_rows(weights, [])]
    [], [repetitions, ..remaining_repetitions] -> [
      row("", repetitions),
      ..submitted_rows([], remaining_repetitions)
    ]
    [weight, ..weights], [repetitions, ..remaining_repetitions] -> [
      row(weight, repetitions),
      ..submitted_rows(weights, remaining_repetitions)
    ]
  }
}

fn validate_rows(
  rows: List(CreateSetRow),
) -> Result(ValidatedCreateSets, CreateSetsForm) {
  let #(validated_rows, sets, has_errors) =
    list.fold(rows, #([], [], False), fn(acc, row) {
      let row_form =
        new_row_form()
        |> form.add_values([
          #("weight", row.weight),
          #("repetitions", row.repetitions),
        ])

      case form.run(row_form) {
        Ok(set) -> #([row, ..acc.0], [set, ..acc.1], acc.2)
        Error(row_form) -> {
          let invalid_row =
            CreateSetRow(
              ..row,
              weight_error: first_error(row_form, "weight"),
              repetitions_error: first_error(row_form, "repetitions"),
            )
          #([invalid_row, ..acc.0], acc.1, True)
        }
      }
    })

  let form =
    CreateSetsForm(rows: list.reverse(validated_rows), error: option.None)

  case has_errors {
    True -> Error(form)
    False -> Ok(ValidatedCreateSets(sets: list.reverse(sets), form:))
  }
}

fn first_error(row_form, field: String) -> option.Option(String) {
  row_form
  |> form.field_error_messages(field)
  |> list.first()
  |> option.from_result()
}

fn new_row_form() {
  let schema = {
    use weight <- form.field(
      "weight",
      form.parse_float
        |> form.check_float_more_than(0.0)
        |> form.check_float_less_than(1000.001),
    )
    use repetitions <- form.field(
      "repetitions",
      form.parse_int
        |> form.check_int_more_than(0)
        |> form.check_int_less_than(1000),
    )

    form.success(CreateSet(weight:, repetitions:))
  }

  form.new(schema)
}
